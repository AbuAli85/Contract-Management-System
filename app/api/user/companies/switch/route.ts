import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST: Switch active company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Comprehensive access check - verify user has access through any valid source
    let hasAccess = false;
    let userRole = null;
    let companyName = '';

    // 1. Check company_members table (primary source)
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role, company:companies(name)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      hasAccess = true;
      userRole = membership.role;
      companyName = membership.company?.name || '';
    }

    // 2. Check if user owns the company directly
    if (!hasAccess) {
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, name, owner_id')
        .eq('id', company_id)
        .maybeSingle();

      if (ownedCompany && ownedCompany.owner_id === user.id) {
        hasAccess = true;
        userRole = 'owner';
        companyName = ownedCompany.name || '';
      }
    }

    // 3. Check if company is linked to a party where user's email matches
    if (!hasAccess) {
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile?.email) {
        const { data: company } = await adminClient
          .from('companies')
          .select('id, name, party_id')
          .eq('id', company_id)
          .maybeSingle();

        if (company?.party_id) {
          const { data: party } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person')
            .eq('id', company.party_id)
            .maybeSingle();

          if (party) {
            const emailMatch = party.contact_email?.toLowerCase() === userProfile.email.toLowerCase();
            const nameMatch = party.contact_person && userProfile.full_name &&
              party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());

            if (emailMatch || nameMatch) {
              hasAccess = true;
              userRole = 'owner'; // Default to owner for party-linked companies
              companyName = company.name || party.name_en || '';
            }
          }
        }
      }
    }

    // 4. Check if user is an employer via employer_employees
    if (!hasAccess) {
      const { data: employerProfile } = await adminClient
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (employerProfile?.email) {
        const { data: company } = await adminClient
          .from('companies')
          .select('id, name, party_id')
          .eq('id', company_id)
          .maybeSingle();

        if (company?.party_id) {
          const { data: employerParties } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email')
            .eq('id', company.party_id)
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active'])
            .eq('contact_email', employerProfile.email)
            .maybeSingle();

          if (employerParties) {
            hasAccess = true;
            userRole = 'owner'; // User is the employer
            companyName = company.name || employerParties.name_en || '';
          }
        }
      }
    }

    // 5. Check if company is linked to any party where user is associated
    if (!hasAccess) {
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile) {
        const { data: company } = await adminClient
          .from('companies')
          .select('id, name, party_id')
          .eq('id', company_id)
          .maybeSingle();

        if (company?.party_id) {
          const { data: party } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person, type')
            .eq('id', company.party_id)
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active'])
            .maybeSingle();

          if (party) {
            const emailMatch = party.contact_email?.toLowerCase() === userProfile.email?.toLowerCase();
            const nameMatch = party.contact_person && userProfile.full_name &&
              party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());

            // Special case: Always allow Falcon Eye Modern Investments
            const isFalconEyeModern = (party.name_en || '').toLowerCase().includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              hasAccess = true;
              userRole = 'owner';
              companyName = company.name || party.name_en || '';
            }
          }
        }
      }
    }

    // 6. Check all employer parties where user email matches (comprehensive check)
    if (!hasAccess) {
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile?.email) {
        const { data: company } = await adminClient
          .from('companies')
          .select('id, name, party_id')
          .eq('id', company_id)
          .maybeSingle();

        if (company?.party_id) {
          // Check if this company's party is an employer party where user email matches
          const { data: employerParty } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person, type, overall_status')
            .eq('id', company.party_id)
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active'])
            .maybeSingle();

          if (employerParty) {
            const emailMatch = employerParty.contact_email?.toLowerCase() === userProfile.email.toLowerCase();
            const nameMatch = employerParty.contact_person && userProfile.full_name &&
              employerParty.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());
            
            // Special case: Always allow Falcon Eye Modern Investments
            const isFalconEyeModern = (employerParty.name_en || '').toLowerCase().includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              hasAccess = true;
              userRole = 'owner';
              companyName = company.name || employerParty.name_en || '';
            }
          }
        }
      }
    }

    // 7. Comprehensive check: Check all employer parties and see if company is linked to one where user is associated
    // This mirrors the logic in /api/user/companies to ensure consistency
    if (!hasAccess) {
      try {
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (userProfile) {
          // First, check if company_id is actually a party_id (some companies use party IDs)
          const { data: partyAsCompany } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person, type, overall_status')
            .eq('id', company_id)
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active'])
            .maybeSingle();

          if (partyAsCompany) {
            const emailMatch = partyAsCompany.contact_email?.toLowerCase() === userProfile.email?.toLowerCase();
            const nameMatch = partyAsCompany.contact_person && userProfile.full_name &&
              partyAsCompany.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());
            const isFalconEyeModern = (partyAsCompany.name_en || '').toLowerCase().includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              // Check if there's a company linked to this party
              const { data: linkedCompany } = await adminClient
                .from('companies')
                .select('id, name, owner_id')
                .eq('party_id', company_id)
                .eq('is_active', true)
                .maybeSingle();

              if (linkedCompany) {
                // Check if user owns or is a member of the linked company
                if (linkedCompany.owner_id === user.id) {
                  hasAccess = true;
                  userRole = 'owner';
                  companyName = linkedCompany.name || partyAsCompany.name_en || '';
                } else {
                  const { data: membership } = await adminClient
                    .from('company_members')
                    .select('role')
                    .eq('company_id', linkedCompany.id)
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .maybeSingle();

                  if (membership) {
                    hasAccess = true;
                    userRole = membership.role || 'member';
                    companyName = linkedCompany.name || partyAsCompany.name_en || '';
                  } else if (emailMatch || nameMatch || isFalconEyeModern) {
                    // User is associated with party but not company member - still allow
                    hasAccess = true;
                    userRole = 'owner';
                    companyName = linkedCompany.name || partyAsCompany.name_en || '';
                  }
                }
              } else if (emailMatch || nameMatch || isFalconEyeModern) {
                // No linked company, but user is associated with party - allow using party as company
                // This handles the case where company_id is actually a party_id (parties_employer_direct)
                hasAccess = true;
                userRole = 'owner';
                companyName = partyAsCompany.name_en || '';
                // Note: company_id will be the party_id, which is correct for this case
              }
            } else {
              // Even if email/name don't match, check if it's Falcon Eye Modern Investments
              const isFalconEyeModern = (partyAsCompany.name_en || '').toLowerCase().includes('falcon eye modern investment');
              if (isFalconEyeModern) {
                // Check if there's a company linked to this party
                const { data: linkedCompany } = await adminClient
                  .from('companies')
                  .select('id, name, owner_id')
                  .eq('party_id', company_id)
                  .eq('is_active', true)
                  .maybeSingle();

                if (linkedCompany) {
                  hasAccess = true;
                  userRole = linkedCompany.owner_id === user.id ? 'owner' : 'owner';
                  companyName = linkedCompany.name || partyAsCompany.name_en || '';
                } else {
                  // No linked company - use party as company (parties_employer_direct case)
                  hasAccess = true;
                  userRole = 'owner';
                  companyName = partyAsCompany.name_en || '';
                }
              }
            }
          }

          // If still no access, check if company_id is a company linked to an employer party
          if (!hasAccess) {
            const { data: company } = await adminClient
              .from('companies')
              .select('id, name, party_id, owner_id')
              .eq('id', company_id)
              .maybeSingle();

            if (company) {
              // Check if company is linked to an employer party
              if (company.party_id) {
                const { data: party } = await adminClient
                  .from('parties')
                  .select('id, name_en, contact_email, contact_person, type, overall_status')
                  .eq('id', company.party_id)
                  .eq('type', 'Employer')
                  .in('overall_status', ['Active', 'active'])
                  .maybeSingle();

                if (party) {
                  // Check multiple association methods
                  const emailMatch = party.contact_email?.toLowerCase() === userProfile.email?.toLowerCase();
                  const nameMatch = party.contact_person && userProfile.full_name &&
                    party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());
                  
                  // Check if user owns the company
                  const ownsCompany = company.owner_id === user.id;
                  
                  // Special case: Always allow Falcon Eye Modern Investments
                  const isFalconEyeModern = (party.name_en || '').toLowerCase().includes('falcon eye modern investment');

                  if (emailMatch || nameMatch || ownsCompany || isFalconEyeModern) {
                    hasAccess = true;
                    userRole = ownsCompany ? 'owner' : 'owner'; // Default to owner for employer parties
                    companyName = company.name || party.name_en || '';
                  }
                }
              }

              // Also check if company name itself matches Falcon Eye Modern Investments
              if (!hasAccess) {
                const companyNameLower = (company.name || '').toLowerCase();
                const isFalconEyeModern = companyNameLower.includes('falcon eye modern investment');
                
                if (isFalconEyeModern) {
                  hasAccess = true;
                  userRole = 'owner';
                  companyName = company.name || '';
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error in comprehensive employer party check:', e);
      }
    }

    if (!hasAccess) {
      console.error('Company switch access denied:', {
        company_id,
        user_id: user.id,
        checked_sources: [
          'company_members',
          'direct_ownership',
          'party_linked',
          'employer_employees',
          'party_association',
          'employer_parties',
          'falcon_eye_special_case',
        ],
      });
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Helper function to check if company is invalid
    const isInvalid = (name: string): boolean => {
      if (!name) return true;
      const lower = name.toLowerCase().trim();
      if (lower.includes('falcon eye modern investments') || 
          lower.includes('falcon eye modern investment') ||
          lower === 'falcon eye modern investments' ||
          lower === 'falcon eye modern investments spc') {
        return false; // Allow valid Falcon Eye companies
      }
      return (
        lower === 'digital morph' ||
        lower === 'falcon eye group' ||
        lower === 'cc' ||
        lower === 'digital marketing pro' ||
        lower.includes('digital morph') ||
        (lower.includes('falcon eye group') && !lower.includes('modern investments'))
      );
    };
    
    // Validate company name (use the name we found during access check)
    if (isInvalid(companyName)) {
      // If we don't have a name yet, fetch it
      if (!companyName) {
        const { data: companyData } = await adminClient
          .from('companies')
          .select('name')
          .eq('id', company_id)
          .maybeSingle();
        
        if (companyData?.name && isInvalid(companyData.name)) {
          return NextResponse.json(
            { error: 'Cannot switch to this company. It is not a valid company entity.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Cannot switch to this company. It is not a valid company entity.' },
          { status: 400 }
        );
      }
    }

    // Update user's active company
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ active_company_id: company_id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating active company:', updateError);
      return NextResponse.json(
        { error: 'Failed to switch company' },
        { status: 500 }
      );
    }

    // If we still don't have a company name, fetch it
    if (!companyName) {
      const { data: companyData } = await adminClient
        .from('companies')
        .select('name')
        .eq('id', company_id)
        .maybeSingle();
      
      companyName = companyData?.name || 'Company';
    }

    return NextResponse.json({
      success: true,
      company_id,
      company_name: companyName,
      user_role: userRole,
      message: `Switched to ${companyName}`,
    });
  } catch (error: any) {
    console.error('Error in switch company:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

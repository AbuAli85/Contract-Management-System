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

    // 7. Special case: Always allow Falcon Eye Modern Investments (final fallback)
    if (!hasAccess) {
      const { data: company } = await adminClient
        .from('companies')
        .select('id, name, party_id')
        .eq('id', company_id)
        .maybeSingle();

      if (company) {
        const companyNameLower = (company.name || '').toLowerCase();
        const isFalconEyeModern = companyNameLower.includes('falcon eye modern investment');
        
        if (isFalconEyeModern) {
          // If company has a party, check if it's an active employer party
          if (company.party_id) {
            const { data: party } = await adminClient
              .from('parties')
              .select('id, name_en, type, overall_status')
              .eq('id', company.party_id)
              .maybeSingle();

            if (party && party.type === 'Employer' && ['Active', 'active'].includes(party.overall_status || '')) {
              hasAccess = true;
              userRole = 'owner';
              companyName = company.name || party.name_en || '';
            }
          } else {
            // Even without party, allow if name matches
            hasAccess = true;
            userRole = 'owner';
            companyName = company.name || '';
          }
        }
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

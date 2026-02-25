import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompany } from '@/lib/company-service';
import { withRBAC } from '@/lib/rbac/guard';

// GET - Fetch single company by ID
export const GET = withRBAC(
  'company:manage:all',
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient();

      // Get authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const companyId = params.id;

      if (!companyId) {
        return NextResponse.json(
          {
            error: 'Company ID is required',
          },
          { status: 400 }
        );
      }

      const company = await getCompany(companyId, user.id);

      if (!company) {
        return NextResponse.json(
          {
            error: 'Company not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: company,
      });
    } catch (error: any) {

      if (error.message.includes('permissions')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      return NextResponse.json(
        {
          error: error.message || 'Internal server error',
        },
        { status: 500 }
      );
    }
  }
);

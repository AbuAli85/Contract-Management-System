'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { XIcon, PlusIcon, Loader2 } from 'lucide-react';

interface HoldingGroupMember {
  id: string;
  party_id?: string;
  company_id?: string;
  member_type: 'party' | 'company';
  party?: {
    id: string;
    name_en: string;
    name_ar?: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

interface Party {
  id: string;
  name_en: string;
  name_ar?: string;
  type: string;
}

interface Company {
  id: string;
  name: string;
}

interface HoldingGroupMembersManagerProps {
  holdingGroupId: string;
  holdingGroupName: string;
}

export function HoldingGroupMembersManager({
  holdingGroupId,
  holdingGroupName,
}: HoldingGroupMembersManagerProps) {
  const [members, setMembers] = useState<HoldingGroupMember[]>([]);
  const [availableParties, setAvailableParties] = useState<Party[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMemberType, setSelectedMemberType] = useState<'party' | 'company'>('party');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
    fetchAvailableParties();
    fetchAvailableCompanies();
  }, [holdingGroupId]);

  async function fetchMembers() {
    try {
      const response = await fetch(`/api/holding-groups/${holdingGroupId}/members`);
      const { data, error } = await response.json();

      if (error) throw new Error(error);
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching members',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAvailableParties() {
    try {
      const response = await fetch('/api/parties?type=Employer');
      const { data, error } = await response.json();

      if (error) throw new Error(error);
      // Filter out parties already in the holding group
      const memberPartyIds = members.map(m => m.party_id).filter(Boolean);
      setAvailableParties(
        (data || []).filter((p: Party) => !memberPartyIds.includes(p.id))
      );
    } catch (error: any) {
      console.error('Error fetching parties:', error);
    }
  }

  async function fetchAvailableCompanies() {
    try {
      const response = await fetch('/api/companies');
      const { data, error } = await response.json();

      if (error) throw new Error(error);
      // Filter out companies already in the holding group
      const memberCompanyIds = members.map(m => m.company_id).filter(Boolean);
      setAvailableCompanies(
        (data || []).filter((c: Company) => !memberCompanyIds.includes(c.id))
      );
    } catch (error: any) {
      console.error('Error fetching companies:', error);
    }
  }

  async function handleAddMembers() {
    if (selectedMemberIds.length === 0) {
      toast({
        title: 'No members selected',
        description: 'Please select at least one member to add',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/holding-groups/${holdingGroupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_ids: selectedMemberIds,
          member_type: selectedMemberType,
        }),
      });

      const { error } = await response.json();

      if (error) throw new Error(error);

      toast({
        title: 'Members added',
        description: `Successfully added ${selectedMemberIds.length} member(s)`,
      });

      setIsDialogOpen(false);
      setSelectedMemberIds([]);
      fetchMembers();
      fetchAvailableParties();
      fetchAvailableCompanies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const response = await fetch(
        `/api/holding-groups/${holdingGroupId}/members?member_ids=${memberId}`,
        {
          method: 'DELETE',
        }
      );

      const { error } = await response.json();

      if (error) throw new Error(error);

      toast({
        title: 'Member removed',
        description: 'Successfully removed member from holding group',
      });

      fetchMembers();
      fetchAvailableParties();
      fetchAvailableCompanies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  const availableItems = selectedMemberType === 'party' ? availableParties : availableCompanies;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members of {holdingGroupName}</CardTitle>
            <CardDescription>
              Companies and parties belonging to this holding group
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Members to Holding Group</DialogTitle>
                <DialogDescription>
                  Select companies or parties to add to this holding group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member Type</label>
                  <Select
                    value={selectedMemberType}
                    onValueChange={(value) => {
                      setSelectedMemberType(value as 'party' | 'company');
                      setSelectedMemberIds([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="party">Parties (Employers)</SelectItem>
                      <SelectItem value="company">Companies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select {selectedMemberType === 'party' ? 'Parties' : 'Companies'}
                  </label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!selectedMemberIds.includes(value)) {
                        setSelectedMemberIds([...selectedMemberIds, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${selectedMemberType === 'party' ? 'a party' : 'a company'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {selectedMemberType === 'party'
                            ? (item as Party).name_en
                            : (item as Company).name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMemberIds.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Members</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemberIds.map((id) => {
                        const item = availableItems.find(i => i.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {selectedMemberType === 'party'
                              ? (item as Party)?.name_en
                              : (item as Company)?.name}
                            <button
                              onClick={() => {
                                setSelectedMemberIds(selectedMemberIds.filter(i => i !== id));
                              }}
                              className="ml-1"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedMemberIds([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddMembers}>Add Members</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No members in this holding group. Add members to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {member.member_type === 'party'
                      ? member.party?.name_en
                      : member.company?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.member_type === 'party' ? 'Party' : 'Company'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


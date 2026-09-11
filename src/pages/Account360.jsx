import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Building2, MessageSquare, NotebookPen, Plus, RefreshCcw, Target, UserPlus } from "lucide-react";

function emptyAccount() {
  return { name: "", industry: "", relationship_status: "healthy", estimated_value: "" };
}

export default function Account360() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");
  const queryClient = useQueryClient();
  const [accountForm, setAccountForm] = React.useState(emptyAccount());
  const [contactName, setContactName] = React.useState("");
  const [interactionSubject, setInteractionSubject] = React.useState("");
  const [noteBody, setNoteBody] = React.useState("");
  const [opportunityTitle, setOpportunityTitle] = React.useState("");

  const accountsQuery = useQuery({ queryKey: ["crm-accounts"], queryFn: () => api.crm.accounts.list() });
  const accountQuery = useQuery({
    queryKey: ["crm-account-360", selectedId],
    queryFn: () => api.crm.accounts.account360(selectedId),
    enabled: Boolean(selectedId),
  });

  React.useEffect(() => {
    if (!selectedId && accountsQuery.data?.[0]?.id) setParams({ id: accountsQuery.data[0].id });
  }, [accountsQuery.data, selectedId, setParams]);

  const createAccount = useMutation({
    mutationFn: (data) => api.crm.accounts.create(data),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ["crm-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-client-intelligence"] });
      setAccountForm(emptyAccount());
      setParams({ id: account.id });
    },
  });

  const refreshAccount = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["crm-account-360", selectedId] });
    queryClient.invalidateQueries({ queryKey: ["crm-client-intelligence"] });
  };

  const addContact = useMutation({
    mutationFn: () => api.crm.accounts.addContact(selectedId, { full_name: contactName }),
    onSuccess: () => { setContactName(""); refreshAccount(); },
  });
  const addInteraction = useMutation({
    mutationFn: () => api.crm.accounts.addInteraction(selectedId, { subject: interactionSubject, interaction_type: "call" }),
    onSuccess: () => { setInteractionSubject(""); refreshAccount(); },
  });
  const addNote = useMutation({
    mutationFn: () => api.crm.accounts.addNote(selectedId, { body: noteBody, subject: "Account note" }),
    onSuccess: () => { setNoteBody(""); refreshAccount(); },
  });
  const addOpportunity = useMutation({
    mutationFn: () => api.crm.accounts.addOpportunity(selectedId, { title: opportunityTitle, probability: 25 }),
    onSuccess: () => { setOpportunityTitle(""); refreshAccount(); },
  });
  const refreshHealth = useMutation({
    mutationFn: () => api.crm.accounts.refreshHealth(selectedId),
    onSuccess: refreshAccount,
  });

  const accounts = accountsQuery.data || [];
  const account360 = accountQuery.data;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-gray-400">CRM Foundation</p>
        <h1 className="text-3xl font-bold text-gray-950">Account 360</h1>
        <p className="text-gray-500 mt-1">One view of a client account, contacts, interactions, notes, opportunities, projects, and relationship health.</p>
      </div>

      <div className="grid xl:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Create account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Account name" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
              <Input placeholder="Industry" value={accountForm.industry} onChange={(e) => setAccountForm({ ...accountForm, industry: e.target.value })} />
              <Input placeholder="Estimated value" type="number" value={accountForm.estimated_value} onChange={(e) => setAccountForm({ ...accountForm, estimated_value: e.target.value })} />
              <Button className="w-full" onClick={() => createAccount.mutate(accountForm)} disabled={!accountForm.name || createAccount.isPending}>
                <Plus className="w-4 h-4" /> Add account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Accounts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setParams({ id: account.id })}
                  className={`w-full text-left rounded-xl border p-3 ${selectedId === account.id ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:bg-gray-50"}`}
                >
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.industry || "No industry"} · {account.relationship_status || "healthy"}</p>
                </button>
              ))}
              {!accounts.length && <p className="text-sm text-gray-500">No accounts yet.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!account360 ? (
            <Card><CardContent className="p-8 text-sm text-gray-500">Select or create an account to open Account 360.</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-gray-500" /><Badge variant="outline">{account360.account.status || "active"}</Badge></div>
                    <h2 className="text-2xl font-bold">{account360.account.name}</h2>
                    <p className="text-gray-500">{account360.account.industry || "No industry captured"} · {account360.account.location || "No location captured"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Relationship health</p>
                    <p className="text-4xl font-bold">{account360.health?.score || 0}%</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => refreshHealth.mutate()}><RefreshCcw className="w-4 h-4" /> Refresh</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="w-4 h-4" /> Contacts</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2"><Input placeholder="New contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} /><Button onClick={() => addContact.mutate()} disabled={!contactName}>Add</Button></div>
                    {account360.contacts.map((contact) => <div key={contact.id} className="rounded-lg border p-3"><p className="font-medium">{contact.full_name}</p><p className="text-xs text-gray-500">{contact.position || contact.email || "Contact details pending"}</p></div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="w-4 h-4" /> Opportunities</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2"><Input placeholder="New opportunity" value={opportunityTitle} onChange={(e) => setOpportunityTitle(e.target.value)} /><Button onClick={() => addOpportunity.mutate()} disabled={!opportunityTitle}>Add</Button></div>
                    {account360.opportunities.map((opp) => <div key={opp.id} className="rounded-lg border p-3"><p className="font-medium">{opp.title}</p><p className="text-xs text-gray-500">{opp.status || "open"} · {opp.probability || 0}% probability</p></div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="w-4 h-4" /> Interactions</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2"><Input placeholder="Interaction subject" value={interactionSubject} onChange={(e) => setInteractionSubject(e.target.value)} /><Button onClick={() => addInteraction.mutate()} disabled={!interactionSubject}>Log</Button></div>
                    {account360.interactions.map((item) => <div key={item.id} className="rounded-lg border p-3"><p className="font-medium">{item.subject}</p><p className="text-xs text-gray-500">{item.interaction_type} · {String(item.occurred_at || "").slice(0, 10)}</p></div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><NotebookPen className="w-4 h-4" /> Notes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2"><Input placeholder="Add account note" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} /><Button onClick={() => addNote.mutate()} disabled={!noteBody}>Save</Button></div>
                    {account360.notes.map((note) => <div key={note.id} className="rounded-lg border p-3"><p className="font-medium">{note.subject || "Note"}</p><p className="text-xs text-gray-500">{note.body}</p></div>)}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-4 h-4" />
                    Unified activity timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(account360.timeline || []).map((item) => (
                    <div key={`${item.related_entity_type}-${item.related_entity_id}-${item.type}`} className="rounded-xl border bg-white p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{String(item.type || "activity").replaceAll("_", " ")}</Badge>
                            <span className="text-xs text-gray-400">{item.source || "system"}</span>
                          </div>
                          <p className="font-semibold mt-2">{item.title}</p>
                          {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{String(item.occurred_at || "").slice(0, 10)}</p>
                      </div>
                    </div>
                  ))}
                  {!account360.timeline?.length && (
                    <p className="text-sm text-gray-500">No timeline activity yet. Interactions, proposals, deals, project creation, tasks, and time logs will appear here.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

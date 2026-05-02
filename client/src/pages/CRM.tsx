import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, Clock, Plus, Mail } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CRM() {
  const { user, isAuthenticated } = useAuth();
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
  });

  // Fetch CRM stats
  const { data: stats, isLoading: statsLoading } = trpc.crm.getCrmStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = trpc.crm.getContacts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch scheduled follow-ups
  const { data: scheduledFollowUps, isLoading: followUpsLoading } = trpc.crm.getScheduledFollowUps.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Create contact mutation
  const createContactMutation = trpc.crm.createContact.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully");
      setNewContact({ name: "", email: "", phone: "", company: "", title: "" });
      setShowContactForm(false);
    },
    onError: (error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) {
      toast.error("Name and email are required");
      return;
    }
    await createContactMutation.mutateAsync(newContact);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">CRM Dashboard</h1>
          <p className="text-gray-600 mb-4">Please log in to view your CRM</p>
        </div>
      </div>
    );
  }

  if (statsLoading || contactsLoading || followUpsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">CRM Dashboard</h1>
            <p className="text-slate-600">Manage prospects, leads, and follow-ups</p>
          </div>
          <Button
            onClick={() => setShowContactForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.totalContacts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Prospects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.prospectCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.leadCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.scheduledFollowUps || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts List */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20">
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Manage your prospects and leads</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.slice(0, 10).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                      <p className="text-sm text-slate-600">{contact.email}</p>
                      {contact.company && (
                        <p className="text-sm text-slate-500">{contact.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {contact.status}
                      </span>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Follow-up
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No contacts yet</p>
                <Button onClick={() => setShowContactForm(true)}>
                  Add your first contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Follow-ups */}
        {scheduledFollowUps && scheduledFollowUps.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 mt-6">
            <CardHeader>
              <CardTitle>Upcoming Follow-ups</CardTitle>
              <CardDescription>Scheduled emails to send</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledFollowUps.slice(0, 5).map((followUp) => (
                  <div
                    key={followUp.id}
                    className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-400"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{followUp.subject}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Scheduled for {new Date(followUp.scheduledFor).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {followUp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Contact Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) =>
                        setNewContact({ ...newContact, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact({ ...newContact, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newContact.company}
                      onChange={(e) =>
                        setNewContact({ ...newContact, company: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newContact.title}
                      onChange={(e) =>
                        setNewContact({ ...newContact, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createContactMutation.isPending}
                      className="flex-1"
                    >
                      {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

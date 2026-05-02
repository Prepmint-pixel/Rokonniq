import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, Loader2 } from "lucide-react";

export default function ContactsDashboard() {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch contacts
  const { data: contacts, isLoading, refetch } = trpc.leads.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch stats
  const { data: stats } = trpc.leads.stats.useQuery({});

  // Export CSV
  const { mutate: exportCsv, isPending: isExporting } = (trpc.leads.exportCsv as any).useMutation({
    onSuccess: (data: any) => {
      // Create a blob and download
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", data.filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Contacts exported to CSV");
    },
    onError: (error: any) => {
      alert("Error: " + (error.message || "Failed to export contacts"));
    },
  });

  // Delete contact
  const { mutate: deleteContact, isPending: isDeleting } = trpc.leads.delete.useMutation({
    onSuccess: () => {
      alert("Contact deleted");
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      alert("Error: " + (error.message || "Failed to delete contact"));
    },
  });

  const handleDelete = (id: number) => {
    deleteContact({ id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-gray-600 mt-1">
              Manage captured leads from your digital cards
            </p>
          </div>
          <Button
            onClick={() => exportCsv({})}
            disabled={isExporting || !contacts || contacts.length === 0}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">Total Contacts</div>
              <div className="text-3xl font-bold mt-2">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">Cards</div>
              <div className="text-3xl font-bold mt-2">
                {Object.keys(stats.byCard).length}
              </div>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Loading contacts...</p>
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No contacts yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Contacts will appear here when visitors share their information
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Captured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.firstName} {contact.lastName || ""}
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone || "-"}</TableCell>
                    <TableCell>{contact.company || "-"}</TableCell>
                    <TableCell>{contact.position || "-"}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {contact.createdAt
                        ? new Date(contact.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(contact.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this contact? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

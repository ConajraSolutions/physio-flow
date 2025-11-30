import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { insuranceCompanies, InsuranceCompany } from "@/data/insuranceCompanies";
import { Search, Phone, ExternalLink, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  appointmentId: string;
}

export function BillingDialog({
  open,
  onOpenChange,
  patientName,
  appointmentId,
}: BillingDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsurer, setSelectedInsurer] = useState<InsuranceCompany | null>(null);

  const filteredCompanies = insuranceCompanies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBillSubmit = () => {
    if (!selectedInsurer) return;
    
    toast.success(`Billing initiated with ${selectedInsurer.name}`, {
      description: `Claim for ${patientName} has been submitted.`,
    });
    setSelectedInsurer(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill Insurance</DialogTitle>
          <DialogDescription>
            Select an insurance company to bill for {patientName}'s appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search insurance companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Insurance List */}
          <ScrollArea className="h-[300px] rounded-lg border">
            <div className="p-2 space-y-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedInsurer(company)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                    selectedInsurer?.id === company.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedInsurer?.id === company.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{company.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {company.contactNumber}
                          </span>
                        </div>
                        {company.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {company.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={company.isEDTCompliant ? "completed" : "secondary"}>
                      {company.isEDTCompliant ? "EDT" : "Manual"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Insurer Info */}
          {selectedInsurer && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-foreground">
                Ready to bill: {selectedInsurer.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedInsurer.isEDTCompliant
                  ? "This claim will be submitted automatically via EDT."
                  : "This claim will require manual portal submission."}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleBillSubmit} disabled={!selectedInsurer}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Submit Claim
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Phone, Mail, Calendar, Filter } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

const SORT_OPTIONS = {
  firstName: { column: "first_name", ascending: true as const, secondary: { column: "last_name", ascending: true as const } },
  newest: { column: "created_at", ascending: false as const },
  oldest: { column: "created_at", ascending: true as const },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Patients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof typeof SORT_OPTIONS>("firstName");

  const sortOption = useMemo(() => SORT_OPTIONS[sortKey], [sortKey]);

  const fetchPatients = useCallback(
    async (pageIndex: number, reset = false) => {
      setLoading(true);
      setError(null);

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const search = searchQuery.trim();

      let query = supabase
        .from("patients")
        .select("*", { count: "exact" })
        .order(sortOption.column, { ascending: sortOption.ascending })
        .range(from, to);

      if (sortOption.secondary) {
        query = query.order(sortOption.secondary.column, { ascending: sortOption.secondary.ascending });
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      const { data, error: queryError, count } = await query;
      setLoading(false);

      if (queryError) {
        console.error("Error fetching patients:", queryError);
        setError("Unable to load patients right now.");
        return;
      }

      setTotalCount(count || 0);
      setPatients((prev) => (reset ? data || [] : [...prev, ...(data || [])]));
      setPage(pageIndex + 1);
    },
    [searchQuery, sortOption]
  );

  useEffect(() => {
    setPage(0);
    fetchPatients(0, true);
  }, [fetchPatients]);

  return (
    <MainLayout>
      <PageHeader
        title="Patients"
        description="Manage your patient records and medical history."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        }
      />

      <Card variant="elevated" className="animate-slide-up">
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort / Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSortKey("firstName")}>
                  First name (A–Z)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortKey("newest")}>
                  Newest → Oldest
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortKey("oldest")}>
                  Oldest → Newest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      {error || "No patients found."}
                    </TableCell>
                  </TableRow>
                )}
                {patients.map((patient) => {
                  const fullName = `${patient.first_name} ${patient.last_name}`.trim();
                  return (
                    <TableRow
                      key={patient.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/patients/${patient.id}/history`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {getInitials(fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              DOB: {formatDate(patient.date_of_birth)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {patient.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {patient.phone || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatDate(patient.date_of_birth)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(patient.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => navigate(`/patients/${patient.id}/history`)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>Book Appointment</DropdownMenuItem>
                            <DropdownMenuItem>Send Forms</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => navigate(`/patients/${patient.id}/history`)}>
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Loading patients...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {patients.length} of {totalCount} patients
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || patients.length >= totalCount}
                onClick={() => fetchPatients(page)}
              >
                {loading ? "Loading..." : patients.length >= totalCount ? "No more" : "Load More"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

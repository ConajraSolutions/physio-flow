export interface InsuranceCompany {
  id: string;
  name: string;
  contactNumber: string;
  isEDTCompliant: boolean;
  notes?: string;
}

export const insuranceCompanies: InsuranceCompany[] = [
  {
    id: "manulife",
    name: "Manulife",
    contactNumber: "1-866-407-7878",
    isEDTCompliant: true,
    notes: "OTP"
  },
  {
    id: "claims-secure",
    name: "Claims Secure (AOB)",
    contactNumber: "1-866-783-6847",
    isEDTCompliant: false,
    notes: "FAX: 1-888-513-4464"
  },
  {
    id: "canada-life",
    name: "Canada Life (T-Services AOB)",
    contactNumber: "1-800-957-9777",
    isEDTCompliant: true
  },
  {
    id: "sunlife",
    name: "Sunlife",
    contactNumber: "1-855-301-4786",
    isEDTCompliant: true
  },
  {
    id: "industrial-alliance",
    name: "Industrial Alliance",
    contactNumber: "416-585-8921 / 1-877-422-6487",
    isEDTCompliant: true
  },
  {
    id: "standard-life",
    name: "Standard Life",
    contactNumber: "1-800-499-4415",
    isEDTCompliant: true
  },
  {
    id: "cooperators",
    name: "Co-operators",
    contactNumber: "1-800-265-2662 / 1-800-667-8164",
    isEDTCompliant: false
  },
  {
    id: "blue-cross",
    name: "Blue Cross (Medavie)",
    contactNumber: "1-800-355-9133",
    isEDTCompliant: false
  },
  {
    id: "desjardins",
    name: "Desjardins",
    contactNumber: "416-926-2990",
    isEDTCompliant: true,
    notes: "8am - 5pm"
  },
  {
    id: "wsib",
    name: "WSIB",
    contactNumber: "416-344-1000",
    isEDTCompliant: false,
    notes: "Account: 100132157"
  },
  {
    id: "empire-life",
    name: "Empire Life",
    contactNumber: "1-800-267-0215",
    isEDTCompliant: false
  },
  {
    id: "green-shield",
    name: "Green Shield (Provider Connect)",
    contactNumber: "1-800-265-5615",
    isEDTCompliant: false,
    notes: "8:30am - 4:30pm, TOG: 1018468"
  },
  {
    id: "medx-health",
    name: "MedX1/Health",
    contactNumber: "1-800-551-3008",
    isEDTCompliant: false
  },
  {
    id: "chambers-commerce",
    name: "Chambers of Commerce",
    contactNumber: "1-800-665-3365",
    isEDTCompliant: false
  },
  {
    id: "canada-supplies",
    name: "Canada Supplies",
    contactNumber: "1-877-855-8818",
    isEDTCompliant: false
  },
  {
    id: "ssq-life",
    name: "SSQ Life Insurance Company Inc.",
    contactNumber: "1-866-551-0553",
    isEDTCompliant: false
  },
  {
    id: "equitable-life",
    name: "Equitable Life of Canada",
    contactNumber: "1-800-722-6615",
    isEDTCompliant: false
  }
];

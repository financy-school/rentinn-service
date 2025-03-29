interface CONTRACT_ENTITY_HELPER_DATA {
  [key: string]: {
    entity_name: string;
    entity_address: string;
    license_number: string;
    registration_number: string;
  };
}

export const CONTRACT_ENTITY_HELPER_DATA: CONTRACT_ENTITY_HELPER_DATA = {
  AU: {
    entity_name: "Paynow Technology Pty Ltd trading as Finmo Tech",
    entity_address: "Suite 162, 202 Victoria Road, DRUMMOYNE NSW 2047",
    license_number: "AFSL: 535371",
    registration_number: "ABN: 66 64 24 42 215",
  },
  SG: {
    entity_name: "Finmo Tech Pte. Ltd.",
    entity_address: "Air View Building, 38 Maxwell Rd, #02-08 Singapore 069116",
    license_number: "MAS: PS20200640",
    registration_number: "UEN: 202127305C",
  },
};

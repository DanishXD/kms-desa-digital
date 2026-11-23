// Batas akses data lintas fitur — fungsi murni agar mudah diuji tanpa I/O.
// `Viewer` sengaja struktural supaya tidak bergantung pada tipe server.
export interface Viewer {
  role: string;
  villageId?: string;
  innovatorId?: string;
}

export interface ClaimScope {
  all: boolean;
  villageId?: string;
  innovatorId?: string;
}

/** Scope klaim berdasarkan peran. Peran tak dikenal tidak mendapat scope apa pun (nol baris). */
export function claimFilterFor(user: Viewer): ClaimScope {
  if (user.role === "ADMIN") return { all: true };
  if (user.role === "VILLAGE") return { all: false, villageId: user.villageId };
  if (user.role === "INNOVATOR") return { all: false, innovatorId: user.innovatorId };
  return { all: false };
}

/** Hanya ADMIN yang boleh melihat seluruh katalog, termasuk draf. */
export function canListAllInnovations(role: string | undefined): boolean {
  return role === "ADMIN";
}

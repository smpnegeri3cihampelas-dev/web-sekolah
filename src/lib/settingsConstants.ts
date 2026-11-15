export interface SchoolIdentity {
  schoolName: string;
  npsn: string;
  akreditasi: string;
  region: string;
  address?: string;
  email?: string;
  phone?: string;
  updatedAt?: string;
}

export const DEFAULT_SCHOOL_IDENTITY: SchoolIdentity = {
  schoolName: 'SMP Negeri 3 Cihampelas',
  npsn: '20279930',
  akreditasi: 'B (Baik) - BAN S/M',
  region: 'Cihampelas, Kab. Bandung Barat',
  address: 'Kp. Sukawangi RT 02 / RW 09, Desa Situwangi, Kec. Cihampelas, Kabupaten Bandung Barat, Jawa Barat 40767',
  email: 'info@smpn3cihampelas.sch.id',
  phone: '0812-3456-7890'
};

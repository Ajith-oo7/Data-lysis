declare module 'alasql' {
  interface AlaSQL {
    (sql: string): any;
    options: {
      errorlog: boolean;
      logtarget: string;
    };
    tables: Record<string, { data: any[] }>;
  }

  const alasql: AlaSQL;
  export = alasql;
} 
// AUTO-GENERATED from SOA Excel files. Do not edit by hand.
// Regenerate if source SOA sheets change.

export interface SoaInvoice { num: string; start: string; end: string; amount: number; }
export interface SoaPayment { date: string; invoices: string; amount: number; }
export interface SoaAdjustment { type: 'DEBIT_NOTE' | 'CREDIT_NOTE'; date: string; amount: number; ref: string; }
export interface SoaContact {
  key: string;
  name: string;
  term: number;
  contactId: string;
  accountId: string;
  sales: SoaInvoice[];
  purchases: SoaInvoice[];
  receipts: SoaPayment[];
  payments: SoaPayment[];
  adjustments: SoaAdjustment[];
}

export const SOA_CONTACTS: SoaContact[] = [
  {
    "key": "42com-international-limited",
    "name": "42com International Limited USD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000001",
    "accountId": "50a0a000-0000-4000-8000-000000000001",
    "sales": [
      {
        "num": "140268",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 3605.27
      },
      {
        "num": "140481",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 4950.8
      },
      {
        "num": "140744",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 1635.06
      },
      {
        "num": "140942",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 536.54
      },
      {
        "num": "141187",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 495.68
      },
      {
        "num": "141374",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 530.25
      },
      {
        "num": "141625",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 5259.95
      },
      {
        "num": "141867",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 34158.98
      },
      {
        "num": "142095",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 12635.2
      },
      {
        "num": "142247",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 10334.36
      },
      {
        "num": "142461",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 14747.01
      },
      {
        "num": "142687",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2966.16
      },
      {
        "num": "142929",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 6302.26
      },
      {
        "num": "143137",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 29311.28
      }
    ],
    "purchases": [
      {
        "num": "307294",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 11053.01
      },
      {
        "num": "307498",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 4352.65
      },
      {
        "num": "307585",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 7830.47
      },
      {
        "num": "307630",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 4023.84
      },
      {
        "num": "307810",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 3987.79
      },
      {
        "num": "40284",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 2436.58
      },
      {
        "num": "308037",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 2973.31
      },
      {
        "num": "308228",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 8799.83
      },
      {
        "num": "308296",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 7103.13
      },
      {
        "num": "308359",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 5324.89
      },
      {
        "num": "308527",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 8135.43
      },
      {
        "num": "308640",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2890.77
      },
      {
        "num": "308791",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2711.93
      },
      {
        "num": "308821",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4027.87
      }
    ],
    "receipts": [
      {
        "date": "2026-04-13",
        "invoices": "141187, 141374, 141625, 141867 ",
        "amount": 22247.36
      },
      {
        "date": "2026-04-24",
        "invoices": "142095",
        "amount": 5532.07
      },
      {
        "date": "2026-05-15",
        "invoices": "142247",
        "amount": 5009.47
      },
      {
        "date": "2026-05-28",
        "invoices": "142461",
        "amount": 6611.58
      },
      {
        "date": "2026-06-26",
        "invoices": "142687, 142929",
        "amount": 3665.72
      },
      {
        "date": "2026-07-10",
        "invoices": "143137",
        "amount": 25283.4
      }
    ],
    "payments": [
      {
        "date": "2026-01-14",
        "invoices": "307294",
        "amount": 7447.74
      },
      {
        "date": "2026-02-02",
        "invoices": "307498, 307585",
        "amount": 5597.26
      },
      {
        "date": "2026-03-04",
        "invoices": "307630",
        "amount": 3487.3
      }
    ],
    "adjustments": []
  },
  {
    "key": "airon-fzc-llc",
    "name": "AIRON FZC LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000002",
    "accountId": "50a0a000-0000-4000-8000-000000000002",
    "sales": [
      {
        "num": "142991",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 224.47
      },
      {
        "num": "143152",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 214.84
      }
    ],
    "purchases": [
      {
        "num": "28845",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1052.15
      },
      {
        "num": "28938",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3372.55
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "apelby-gmbh",
    "name": "APELBY GMBH",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000003",
    "accountId": "50a0a000-0000-4000-8000-000000000003",
    "sales": [
      {
        "num": "143292",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 259.42
      }
    ],
    "purchases": [
      {
        "num": "2606HAYO06",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1903.01
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "bharti-airtel-uk",
    "name": "BHARTI AIRTEL UK LIMITED",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000004",
    "accountId": "50a0a000-0000-4000-8000-000000000004",
    "sales": [
      {
        "num": "143279",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 12474.11
      }
    ],
    "purchases": [
      {
        "num": "37688",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 9373.87
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "brilliant-telecom",
    "name": "BRILLIANT TELECOM",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000005",
    "accountId": "50a0a000-0000-4000-8000-000000000005",
    "sales": [
      {
        "num": "140796",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 8499.42
      },
      {
        "num": "141040",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 7544.12
      },
      {
        "num": "141265",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 5954.4
      },
      {
        "num": "141474",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 5279.29
      },
      {
        "num": "141699",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 1515.25
      },
      {
        "num": "141943",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 1490.12
      },
      {
        "num": "142131",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 1091.42
      },
      {
        "num": "142377",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 4390.17
      },
      {
        "num": "142564",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 11513.65
      },
      {
        "num": "142857",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 4238.29
      },
      {
        "num": "143039",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 5451.74
      },
      {
        "num": "143289",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2999.38
      }
    ],
    "purchases": [
      {
        "num": "68204",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 24.54
      },
      {
        "num": "900003823",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 17.07
      },
      {
        "num": "900003931",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 13.99
      },
      {
        "num": "68280",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 75.17
      },
      {
        "num": "68441",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6.41
      },
      {
        "num": "900004080",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6.2
      },
      {
        "num": "68511",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 8.85
      },
      {
        "num": "900004193",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 6.85
      },
      {
        "num": "68824",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 21.63
      },
      {
        "num": "900004340",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 18.07
      },
      {
        "num": "68894",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 0.67
      },
      {
        "num": "900004470",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 129.87
      },
      {
        "num": "900004638",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 723.03
      },
      {
        "num": "900004759",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 2150.7
      },
      {
        "num": "900004928",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 5210.85
      },
      {
        "num": "900005047",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 4033.95
      },
      {
        "num": "900005239",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 3878.46
      },
      {
        "num": "900005361",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2539.48
      }
    ],
    "receipts": [
      {
        "date": "2026-01-26",
        "invoices": "140796",
        "amount": 8457.81
      },
      {
        "date": "2026-02-12",
        "invoices": "141040",
        "amount": 7454.95
      },
      {
        "date": "2026-02-25",
        "invoices": "141265",
        "amount": 5941.79
      },
      {
        "date": "2026-03-13",
        "invoices": "141474",
        "amount": 5263.6
      },
      {
        "date": "2026-03-20",
        "invoices": "141699",
        "amount": 1475.55
      },
      {
        "date": "2026-05-15",
        "invoices": "141943, 142131, 142377, 142564",
        "amount": 8000
      },
      {
        "date": "2026-06-17",
        "invoices": "141943, 142131, 142377, 142564, 142857",
        "amount": 2474.58
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "c3ntro-telecom-ipbtel",
    "name": "C3NTRO TELECOM (IPBTEL, LLC DBA)",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000006",
    "accountId": "50a0a000-0000-4000-8000-000000000006",
    "sales": [
      {
        "num": "143222",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 553.69
      }
    ],
    "purchases": [
      {
        "num": "IN-IPBTEL-016364",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4922.69
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "dial-telecommunications",
    "name": "DIAL TELECOMMUNICATIONS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000007",
    "accountId": "50a0a000-0000-4000-8000-000000000007",
    "sales": [
      {
        "num": "140288",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 3.88
      },
      {
        "num": "140439",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 9047.6
      },
      {
        "num": "140712",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 3791.84
      },
      {
        "num": "140899",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 5410.18
      },
      {
        "num": "141144",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6426.99
      },
      {
        "num": "141333",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 2617.23
      },
      {
        "num": "141579",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 2478.08
      },
      {
        "num": "141783",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 7472.26
      },
      {
        "num": "142032",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 10261.45
      },
      {
        "num": "142280",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 10004.82
      },
      {
        "num": "142519",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 9523.4
      },
      {
        "num": "142771",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 20357.3
      },
      {
        "num": "142994",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 14374.07
      },
      {
        "num": "143211",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11828.88
      }
    ],
    "purchases": [
      {
        "num": "81190",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 5875.14
      },
      {
        "num": "81485",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 11582.15
      },
      {
        "num": "81800",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 5830.38
      },
      {
        "num": "82075",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 7478.01
      },
      {
        "num": "82498",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 24266.26
      },
      {
        "num": "82687",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 7147.31
      },
      {
        "num": "83140",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 10414.81
      },
      {
        "num": "68019",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 1.5
      },
      {
        "num": "83432",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 5450.74
      },
      {
        "num": "68212",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 0.35
      },
      {
        "num": "83766",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 3708.41
      },
      {
        "num": "68427",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 6.65
      },
      {
        "num": "84060",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 1537.97
      },
      {
        "num": "84395",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 13870.55
      },
      {
        "num": "84749",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 18195.09
      },
      {
        "num": "85160",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 4884.79
      },
      {
        "num": "85460",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 12447.69
      }
    ],
    "receipts": [
      {
        "date": "2026-05-11",
        "invoices": "142032, 142280, 142519",
        "amount": 14556.13
      }
    ],
    "payments": [
      {
        "date": "2026-01-08",
        "invoices": "81190",
        "amount": 5871.26
      },
      {
        "date": "2026-01-26",
        "invoices": "81485",
        "amount": 2534.55
      },
      {
        "date": "2026-03-09",
        "invoices": "81800, 82075, 82498",
        "amount": 21945.64
      },
      {
        "date": "2026-03-16",
        "invoices": "82687",
        "amount": 4530.08
      },
      {
        "date": "2026-04-03",
        "invoices": "",
        "amount": 5460.15
      }
    ],
    "adjustments": []
  },
  {
    "key": "didww",
    "name": "DIDWW",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000008",
    "accountId": "50a0a000-0000-4000-8000-000000000008",
    "sales": [
      {
        "num": "140470",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 16124.12
      },
      {
        "num": "140931",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 21657.06
      },
      {
        "num": "141362",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 25857.97
      },
      {
        "num": "141823",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 19902.87
      },
      {
        "num": "142304",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 20157.1
      },
      {
        "num": "142797",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 20761.9
      },
      {
        "num": "143233",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 17280.05
      }
    ],
    "purchases": [
      {
        "num": "03-160197-202512-01",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 145.94
      },
      {
        "num": "03-160197-202601-01",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 203.67
      },
      {
        "num": "INVOICE 03-160197-202602-01",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 197.03
      },
      {
        "num": "03-160197-202603-01",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 410.26
      },
      {
        "num": "03-160197-202604-01",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 200.7
      },
      {
        "num": "03-160197-202605-01",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 100.58
      },
      {
        "num": "03-160197-202606-01\r\n",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 201.04
      }
    ],
    "receipts": [
      {
        "date": "2026-01-22",
        "invoices": "140470",
        "amount": 15952.64
      },
      {
        "date": "2026-02-20",
        "invoices": "140931",
        "amount": 21453.39
      },
      {
        "date": "2026-03-19",
        "invoices": "141362",
        "amount": 25660.94
      },
      {
        "date": "2026-04-16",
        "invoices": "141823",
        "amount": 19492.61
      },
      {
        "date": "2026-05-22",
        "invoices": "142304",
        "amount": 19956.4
      },
      {
        "date": "2026-06-19",
        "invoices": "142797",
        "amount": 20661.32
      }
    ],
    "payments": [],
    "adjustments": [
      {
        "type": "CREDIT_NOTE",
        "date": "2025-12-31",
        "amount": 25.54,
        "ref": "140470"
      }
    ]
  },
  {
    "key": "direct-telco-llc",
    "name": "DIRECT TELCO LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000009",
    "accountId": "50a0a000-0000-4000-8000-000000000009",
    "sales": [
      {
        "num": "143230",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 425.35
      }
    ],
    "purchases": [
      {
        "num": "DT/HY/01JUL2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2156.3
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ecocarrier-inc",
    "name": "ECOCARRIER INC",
    "term": 5,
    "contactId": "50a0c000-0000-4000-8000-000000000010",
    "accountId": "50a0a000-0000-4000-8000-000000000010",
    "sales": [
      {
        "num": "143183",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 22.26
      }
    ],
    "purchases": [
      {
        "num": "119334",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 6744.72
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-09",
        "invoices": "143183",
        "amount": 6722.46
      }
    ],
    "adjustments": []
  },
  {
    "key": "first-sunrise-group",
    "name": "FIRST SUNRISE GROUP, INC.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000011",
    "accountId": "50a0a000-0000-4000-8000-000000000011",
    "sales": [
      {
        "num": "143146",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 405.81
      }
    ],
    "purchases": [
      {
        "num": "20260740165570",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1542.43
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "globe-teleservices",
    "name": "GLOBE TELESERVICES",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000012",
    "accountId": "50a0a000-0000-4000-8000-000000000012",
    "sales": [
      {
        "num": "143153",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3519.52
      }
    ],
    "purchases": [
      {
        "num": "200368",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1111.45
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ipvoip-s-r",
    "name": "IPVOIP s.r.o.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000013",
    "accountId": "50a0a000-0000-4000-8000-000000000013",
    "sales": [
      {
        "num": "143108",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 118.9
      }
    ],
    "purchases": [
      {
        "num": "7682606010630",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 6867.16
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "sipstatus-global-ltd",
    "name": "SIPSTATUS GLOBAL LTD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000014",
    "accountId": "50a0a000-0000-4000-8000-000000000014",
    "sales": [
      {
        "num": "143277",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 14558.76
      }
    ],
    "purchases": [
      {
        "num": "SG2026-001215",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 6070.06
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "sync-sound-llc",
    "name": "SYNC SOUND LLC",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000015",
    "accountId": "50a0a000-0000-4000-8000-000000000015",
    "sales": [],
    "purchases": [
      {
        "num": "INV-9235180",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 1424.67
      },
      {
        "num": "INV-9235172",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 970.21
      },
      {
        "num": "INV-9235199",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 1151.54
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "t-rk-telekom",
    "name": "Türk Telekom International",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000016",
    "accountId": "50a0a000-0000-4000-8000-000000000016",
    "sales": [
      {
        "num": "143118",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1224.26
      }
    ],
    "purchases": [
      {
        "num": "9010064243",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1387.2
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "talk-to-me",
    "name": "TALK TO ME",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000017",
    "accountId": "50a0a000-0000-4000-8000-000000000017",
    "sales": [],
    "purchases": [
      {
        "num": "INV607060003",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 6514.37
      },
      {
        "num": "INV607130003",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 8944.29
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telko-ms",
    "name": "TELKO MS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000018",
    "accountId": "50a0a000-0000-4000-8000-000000000018",
    "sales": [
      {
        "num": "143171",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.07
      }
    ],
    "purchases": [
      {
        "num": " INV/IDA-USD/HAYOTEL/JUNE2026-002",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1965.14
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ultranet-telecom-ghana",
    "name": "ULTRANET TELECOM GHANA LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000019",
    "accountId": "50a0a000-0000-4000-8000-000000000019",
    "sales": [
      {
        "num": "143199",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4772.99
      }
    ],
    "purchases": [
      {
        "num": "HT0002119­USD",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2927.68
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "voicespin-ltd",
    "name": "VOICESPIN LTD",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000020",
    "accountId": "50a0a000-0000-4000-8000-000000000020",
    "sales": [
      {
        "num": "143093",
        "start": "2026-06-22",
        "end": "2026-06-28",
        "amount": 597.15
      },
      {
        "num": "143319",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 633
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vox-master-llc",
    "name": "Vox Master LLC",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000021",
    "accountId": "50a0a000-0000-4000-8000-000000000021",
    "sales": [
      {
        "num": "142941",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 909.88
      },
      {
        "num": "143127",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 98.42
      }
    ],
    "purchases": [
      {
        "num": "3713-160626",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 11169.52
      },
      {
        "num": "3713-010726",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11614.94
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-09",
        "invoices": "142941, 143127",
        "amount": 11516.52
      }
    ],
    "adjustments": []
  },
  {
    "key": "wic-worldcom-international",
    "name": "WIC WORLDCOM INTERNATIONAL",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000022",
    "accountId": "50a0a000-0000-4000-8000-000000000022",
    "sales": [
      {
        "num": "143143",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1236.47
      }
    ],
    "purchases": [
      {
        "num": "WIC-26003329",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5387.62
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  }
];

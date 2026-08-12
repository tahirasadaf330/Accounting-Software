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
  },
  {
    "key": "b-i-c",
    "name": "B.I.C.S",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000023",
    "accountId": "50a0a000-0000-4000-8000-000000000023",
    "sales": [
      {
        "num": "U-2-103092",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 22.21
      },
      {
        "num": "143269",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 136056.99
      }
    ],
    "purchases": [
      {
        "num": "871388",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1525.17
      },
      {
        "num": "871206",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 57815.29
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "bird",
    "name": "BIRD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000024",
    "accountId": "50a0a000-0000-4000-8000-000000000024",
    "sales": [
      {
        "num": "143260",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 2315.93
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "business-telecommunications-services",
    "name": "BUSINESS TELECOMMUNICATIONS SERVICES (BTS)",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000025",
    "accountId": "50a0a000-0000-4000-8000-000000000025",
    "sales": [
      {
        "num": "143261",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 27721.84
      }
    ],
    "purchases": [
      {
        "num": "129190",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 12806.72
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "dawn-global-services",
    "name": "DAWN GLOBAL SERVICES LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000026",
    "accountId": "50a0a000-0000-4000-8000-000000000026",
    "sales": [
      {
        "num": "143190",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1237.82
      }
    ],
    "purchases": [
      {
        "num": "PRE-INVOICE-23330",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3007.89
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "galaxy-one-network",
    "name": "GALAXY ONE NETWORK PTE. LTD. (former Green Packet Global Pte Ltd)",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000027",
    "accountId": "50a0a000-0000-4000-8000-000000000027",
    "sales": [
      {
        "num": "143112",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 125.29
      }
    ],
    "purchases": [
      {
        "num": " I­042355\r\n",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 279.32
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "global-reach-communications",
    "name": "GLOBAL REACH COMMUNICATIONS",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000028",
    "accountId": "50a0a000-0000-4000-8000-000000000028",
    "sales": [
      {
        "num": "143291",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 407.31
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "idt-voip",
    "name": "IDT VOIP",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000029",
    "accountId": "50a0a000-0000-4000-8000-000000000029",
    "sales": [
      {
        "num": "143220",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 39488.7
      }
    ],
    "purchases": [
      {
        "num": "723440",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2652.61
      },
      {
        "num": "723437",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2810.05
      }
    ],
    "receipts": [
      {
        "date": "2026-07-07",
        "invoices": "143220",
        "amount": 34026.04
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "primetel-plc",
    "name": "PRIMETEL PLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000030",
    "accountId": "50a0a000-0000-4000-8000-000000000030",
    "sales": [
      {
        "num": "142942",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1761.63
      },
      {
        "num": "143169",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1306.43
      }
    ],
    "purchases": [
      {
        "num": "32269",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2080.92
      },
      {
        "num": "32410",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 275.71
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "raza-global-inc",
    "name": "RAZA GLOBAL INC.",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000031",
    "accountId": "50a0a000-0000-4000-8000-000000000031",
    "sales": [
      {
        "num": "143293",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 13445.96
      }
    ],
    "purchases": [
      {
        "num": "Hayo173INV",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 81095.05
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "reshetcall-ltd",
    "name": "RESHETCALL LTD.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000032",
    "accountId": "50a0a000-0000-4000-8000-000000000032",
    "sales": [
      {
        "num": "143175",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 3530.03
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telecom-italia-sparkle",
    "name": "TELECOM ITALIA SPARKLE S.p.A.",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000033",
    "accountId": "50a0a000-0000-4000-8000-000000000033",
    "sales": [
      {
        "num": "143114",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 5378.59
      }
    ],
    "purchases": [
      {
        "num": "TISCCI2026002660",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 31332.42
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telegeeks-telecom-dis",
    "name": "TELEGEEKS TELECOM DiS TICARET LIMITED SiRKETI",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000034",
    "accountId": "50a0a000-0000-4000-8000-000000000034",
    "sales": [
      {
        "num": "143236",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 656.75
      }
    ],
    "purchases": [
      {
        "num": "01303520260630o",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11224.63
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telekom-deutschland-gmbh",
    "name": "TELEKOM DEUTSCHLAND GMBH",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000035",
    "accountId": "50a0a000-0000-4000-8000-000000000035",
    "sales": [
      {
        "num": "143113",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 34838.03
      }
    ],
    "purchases": [
      {
        "num": "9000560142",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 18199.02
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "teltac-worldwide-inc",
    "name": "TELTAC WORLDWIDE INC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000036",
    "accountId": "50a0a000-0000-4000-8000-000000000036",
    "sales": [
      {
        "num": "143223",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 25.7
      }
    ],
    "purchases": [
      {
        "num": "TO2026-221",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 275.37
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vinculum-communication",
    "name": "VINCULUM COMMUNICATION",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000037",
    "accountId": "50a0a000-0000-4000-8000-000000000037",
    "sales": [
      {
        "num": "143234",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3280.31
      }
    ],
    "purchases": [
      {
        "num": "272069",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 86.93
      },
      {
        "num": "272070",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 456.74
      },
      {
        "num": "300250",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2738.18
      },
      {
        "num": "300218",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 856.72
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vonage-america",
    "name": "VONAGE AMERICA",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000038",
    "accountId": "50a0a000-0000-4000-8000-000000000038",
    "sales": [
      {
        "num": "143204",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 260.9
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "wavecrest-networks-ltd",
    "name": "WAVECREST NETWORKS LTD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000039",
    "accountId": "50a0a000-0000-4000-8000-000000000039",
    "sales": [
      {
        "num": "143214",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1175.61
      }
    ],
    "purchases": [
      {
        "num": "250-INVOICE-8196",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.04
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "we2stars-company-limited",
    "name": "WE2STARS COMPANY LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000040",
    "accountId": "50a0a000-0000-4000-8000-000000000040",
    "sales": [
      {
        "num": "143193",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2029.16
      }
    ],
    "purchases": [
      {
        "num": "DGW2S/HAY00026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11604.63
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "382-communications",
    "name": "382 COMMUNICATIONS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000041",
    "accountId": "50a0a000-0000-4000-8000-000000000041",
    "sales": [
      {
        "num": "143023",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 212.41
      },
      {
        "num": "143251",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 33.25
      }
    ],
    "purchases": [
      {
        "num": "Hayotel-06/15/2026",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1765.72
      },
      {
        "num": "Hayotel-06/30/2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1368.1
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "acmetel-usa-llc",
    "name": "ACMETEL USA LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000042",
    "accountId": "50a0a000-0000-4000-8000-000000000042",
    "sales": [
      {
        "num": "142977",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 3953.31
      },
      {
        "num": "143140",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5360.78
      }
    ],
    "purchases": [
      {
        "num": "2026/17837",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2539.26
      },
      {
        "num": "2026/17943 ",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 990.15
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "callcaribe-inc",
    "name": "CALLCARIBE INC",
    "term": 3,
    "contactId": "50a0c000-0000-4000-8000-000000000043",
    "accountId": "50a0a000-0000-4000-8000-000000000043",
    "sales": [],
    "purchases": [
      {
        "num": "CC ­ 019049",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 4131.33
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "cima-telecom",
    "name": "CIMA TELECOM",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000044",
    "accountId": "50a0a000-0000-4000-8000-000000000044",
    "sales": [
      {
        "num": "143332",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 5673.46
      }
    ],
    "purchases": [
      {
        "num": "L1025S11741-11615V000032",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 2633.38
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "evox-trading",
    "name": "EVOX TRADING",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000046",
    "accountId": "50a0a000-0000-4000-8000-000000000046",
    "sales": [
      {
        "num": "139860",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 2928.3
      },
      {
        "num": "140119",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 1097.69
      },
      {
        "num": "140234",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 1529.53
      },
      {
        "num": "140415",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 796.96
      },
      {
        "num": "140686",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 429.71
      },
      {
        "num": "140882",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 991.87
      },
      {
        "num": "141126",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 1038.68
      },
      {
        "num": "141309",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 1807.33
      },
      {
        "num": "141566",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 1439.89
      },
      {
        "num": "141776",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 941.73
      },
      {
        "num": "142027",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 10850.68
      },
      {
        "num": "142273",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 1052.72
      },
      {
        "num": "142514",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 562.9
      },
      {
        "num": "142764",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 766.26
      },
      {
        "num": "142989",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 599.94
      },
      {
        "num": "143208",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 437.29
      }
    ],
    "purchases": [
      {
        "num": "25-11-03069",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 3026.65
      },
      {
        "num": "25-11-03130",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 2438.61
      },
      {
        "num": "25-12-03235",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 1114.33
      },
      {
        "num": "25-12-03294",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 955.65
      },
      {
        "num": "26-1-03368",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 361.88
      },
      {
        "num": "26-1-03429",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 227.57
      },
      {
        "num": "26-2-03500",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 202.87
      },
      {
        "num": "26-02-03566",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 147.46
      },
      {
        "num": "26-03-03648",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 187.35
      },
      {
        "num": "26-03-03722",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 209.41
      },
      {
        "num": "26-04-03804",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 691.41
      },
      {
        "num": "26-04-03874",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 815.52
      },
      {
        "num": "26-05-03961",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 197.79
      },
      {
        "num": "26-05-04022",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 528.86
      },
      {
        "num": "26-05-04107",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 434.14
      },
      {
        "num": "26-06-04178",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 308.47
      }
    ],
    "receipts": [
      {
        "date": "2026-04-23",
        "invoices": "141309, 141566, 141776, 142027, 142273",
        "amount": 13993.18
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "hashikma-n-g",
    "name": "HASHIKMA N.G.N INTERNATIONAL COMMUNICATIONS 015 LTD",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000047",
    "accountId": "50a0a000-0000-4000-8000-000000000047",
    "sales": [],
    "purchases": [
      {
        "num": "6503098",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 3.16
      },
      {
        "num": "6506384",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 3.23
      },
      {
        "num": "6508337",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 3.53
      },
      {
        "num": "6510464",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 3.32
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "liquid-telecommunicatios-u",
    "name": "LIQUID TELECOMMUNICATIOS (U) LTD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000048",
    "accountId": "50a0a000-0000-4000-8000-000000000048",
    "sales": [
      {
        "num": "143285",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 206.21
      }
    ],
    "purchases": [
      {
        "num": "28832",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1067.5
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ngn-corp-s",
    "name": "NGN CORP S.A.L.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000049",
    "accountId": "50a0a000-0000-4000-8000-000000000049",
    "sales": [
      {
        "num": "140031",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 10.54
      },
      {
        "num": "140301",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 20.17
      },
      {
        "num": "140533",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 2304.46
      },
      {
        "num": "140776",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 5106.42
      },
      {
        "num": "140995",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 427.17
      },
      {
        "num": "141240",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 494.09
      },
      {
        "num": "141426",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 57.92
      },
      {
        "num": "141675",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 20.54
      },
      {
        "num": "141896",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 39.61
      },
      {
        "num": "142111",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 12.3
      },
      {
        "num": "142258",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 31.41
      },
      {
        "num": "142465",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 13.97
      },
      {
        "num": "142693",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2.91
      },
      {
        "num": "142935",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 420.1
      },
      {
        "num": "143125",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1868.09
      }
    ],
    "purchases": [
      {
        "num": "68610",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 865.02
      },
      {
        "num": "68746",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 842.02
      },
      {
        "num": "68887",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 182.04
      },
      {
        "num": "69051",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 4496.27
      },
      {
        "num": "69214",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 2286.71
      },
      {
        "num": "69376",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 2431.01
      },
      {
        "num": "69506",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 1388.81
      },
      {
        "num": "69701",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 970.82
      },
      {
        "num": "69861",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 984.75
      },
      {
        "num": "70010",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 724.27
      },
      {
        "num": "70155",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 582.98
      },
      {
        "num": "70296",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 823.32
      },
      {
        "num": "70463",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 379.94
      },
      {
        "num": "70590",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 175.38
      },
      {
        "num": "70733",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1825.84
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-03-19",
        "invoices": "68610, 68746, 68887, 69051, 69214,  69376, 69506",
        "amount": 4071.11
      },
      {
        "date": "2026-05-15",
        "invoices": "69701, 69861, 70010, 70155 ",
        "amount": 3158.96
      }
    ],
    "adjustments": []
  },
  {
    "key": "occam-networks-ltd",
    "name": "OCCAM NETWORKS LTD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000050",
    "accountId": "50a0a000-0000-4000-8000-000000000050",
    "sales": [
      {
        "num": "143147",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11.31
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telebiz",
    "name": "TELEBIZ",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000051",
    "accountId": "50a0a000-0000-4000-8000-000000000051",
    "sales": [
      {
        "num": "143356",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 15680.83
      }
    ],
    "purchases": [
      {
        "num": "INV-20260713-47543",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 4038.5
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "transtalkie-limited",
    "name": "TRANSTALKIE LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000052",
    "accountId": "50a0a000-0000-4000-8000-000000000052",
    "sales": [
      {
        "num": "143126",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5.45
      }
    ],
    "purchases": [
      {
        "num": "HAYO-07-2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1950.95
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "us-matrix-telecomm",
    "name": "US MATRIX TELECOMM...",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000053",
    "accountId": "50a0a000-0000-4000-8000-000000000053",
    "sales": [
      {
        "num": "143192",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 51.06
      }
    ],
    "purchases": [
      {
        "num": "11813",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.02
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vazq-communication-inc",
    "name": "VAZQ COMMUNICATION INC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000054",
    "accountId": "50a0a000-0000-4000-8000-000000000054",
    "sales": [
      {
        "num": "143237",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2313.88
      }
    ],
    "purchases": [
      {
        "num": "VQ85-16062026-30062026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.03
      }
    ],
    "receipts": [
      {
        "date": "2026-07-07",
        "invoices": "VQ85-16062026-30062026",
        "amount": 2313.85
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "voxzi-llc",
    "name": "Voxzi LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000055",
    "accountId": "50a0a000-0000-4000-8000-000000000055",
    "sales": [],
    "purchases": [
      {
        "num": "4705",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 885.73
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "carrier-italia-srl",
    "name": "CARRIER ITALIA SRL",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000056",
    "accountId": "50a0a000-0000-4000-8000-000000000056",
    "sales": [
      {
        "num": "142130",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 0.47
      }
    ],
    "purchases": [
      {
        "num": "0050/I/2026",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 3.97
      },
      {
        "num": "0080/I/2026",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 4.42
      },
      {
        "num": "0081/I/2026",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 0.01
      },
      {
        "num": "0096/I/2026",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 0.26
      },
      {
        "num": ". 0097/I/2026",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 0.11
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "cetin-a-s",
    "name": "CETIN, a.s.",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000057",
    "accountId": "50a0a000-0000-4000-8000-000000000057",
    "sales": [
      {
        "num": "143756",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 110.49
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ckef-ltd-mediatel",
    "name": "CKEF LTD (MEDIATEL)",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000058",
    "accountId": "50a0a000-0000-4000-8000-000000000058",
    "sales": [],
    "purchases": [
      {
        "num": "1708/CKEF",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 1247.17
      },
      {
        "num": "1752/CKEF",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 606.72
      },
      {
        "num": "1757/CKEF",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 34.3
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "cronos-group-ltd",
    "name": "CRONOS GROUP LTD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000059",
    "accountId": "50a0a000-0000-4000-8000-000000000059",
    "sales": [
      {
        "num": "143743",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 21.52
      }
    ],
    "purchases": [
      {
        "num": "CRONOS­1420",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 22542.3
      },
      {
        "num": "CRONOS­1457",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 36364.71
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-30",
        "invoices": "",
        "amount": 22542.3
      }
    ],
    "adjustments": []
  },
  {
    "key": "data-access-solutions",
    "name": "DATA ACCESS SOLUTIONS INC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000060",
    "accountId": "50a0a000-0000-4000-8000-000000000060",
    "sales": [],
    "purchases": [
      {
        "num": "158588",
        "start": "2025-09-16",
        "end": "2025-09-30",
        "amount": 309.77
      },
      {
        "num": "158642",
        "start": "2025-10-01",
        "end": "2025-10-15",
        "amount": 543.28
      },
      {
        "num": "158723",
        "start": "2025-10-16",
        "end": "2025-10-31",
        "amount": 392.69
      },
      {
        "num": "158788",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 424.84
      },
      {
        "num": "158898",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 182.04
      },
      {
        "num": "158968",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 153.07
      },
      {
        "num": "159066",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 255.47
      },
      {
        "num": "159142",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 148.56
      },
      {
        "num": "159242",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 14.96
      },
      {
        "num": "159347",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 35.45
      },
      {
        "num": "159420",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 69.97
      },
      {
        "num": "159524",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 2.17
      },
      {
        "num": "159621",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 3.31
      },
      {
        "num": "159693",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 17.53
      },
      {
        "num": "159798",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 35.85
      },
      {
        "num": "159873",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 100.1
      },
      {
        "num": "159997",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 29.4
      },
      {
        "num": "160071",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 56.62
      },
      {
        "num": "160172",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 49.48
      },
      {
        "num": "160249",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 895.68
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-30",
        "invoices": "",
        "amount": 3720.24
      }
    ],
    "adjustments": []
  },
  {
    "key": "datora-france-communication",
    "name": "DATORA FRANCE COMMUNICATION SAS",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000061",
    "accountId": "50a0a000-0000-4000-8000-000000000061",
    "sales": [
      {
        "num": "143767",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 7.72
      }
    ],
    "purchases": [
      {
        "num": "4121",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 3.44
      },
      {
        "num": "4230",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 0.12
      },
      {
        "num": "4278",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 2.97
      },
      {
        "num": "4359",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 0.5
      },
      {
        "num": "4443",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 0.23
      },
      {
        "num": "4533",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 1.23
      },
      {
        "num": "4594",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 0.13
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "dexatel-ou",
    "name": "DEXATEL OU",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000062",
    "accountId": "50a0a000-0000-4000-8000-000000000062",
    "sales": [
      {
        "num": "143018",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1.06
      },
      {
        "num": "143244",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.65
      },
      {
        "num": "143454",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 0.03
      },
      {
        "num": "143719",
        "start": "2026-07-16",
        "end": "2026-07-31",
        "amount": 132.93
      }
    ],
    "purchases": [
      {
        "num": "32487",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 0.88
      },
      {
        "num": "32855",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 1.89
      },
      {
        "num": "33855",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 0.14
      },
      {
        "num": "34462",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 26.33
      },
      {
        "num": "35775",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 0.4
      },
      {
        "num": "36814",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 62.98
      },
      {
        "num": "36847",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 8.21
      },
      {
        "num": "37348",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 248.26
      },
      {
        "num": "37522",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 155.12
      },
      {
        "num": "38100",
        "start": "2026-07-16",
        "end": "2026-07-31",
        "amount": 1886.18
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "didxl",
    "name": "DIDXL",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000063",
    "accountId": "50a0a000-0000-4000-8000-000000000063",
    "sales": [],
    "purchases": [
      {
        "num": "Hayotel/invoice/2026/00",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 285.1
      },
      {
        "num": " Hayotel/invoice/2026/004",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 280.52
      },
      {
        "num": "Hayotel/invoice/2026/005",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 278.63
      },
      {
        "num": "Hayotel/invoice/2026/006",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 279.48
      },
      {
        "num": "Hayotel/invoice/2026/007",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 279.02
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-02",
        "invoices": "",
        "amount": 1402.75
      }
    ],
    "adjustments": []
  },
  {
    "key": "identidad-telecom",
    "name": "IDENTIDAD TELECOM",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000064",
    "accountId": "50a0a000-0000-4000-8000-000000000064",
    "sales": [
      {
        "num": "142689",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 18.44
      },
      {
        "num": "142930",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 68.83
      },
      {
        "num": "143124",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 64.47
      },
      {
        "num": "143380",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 189.03
      }
    ],
    "purchases": [
      {
        "num": "67365",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 581.32
      },
      {
        "num": "67558",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 508.49
      },
      {
        "num": "67636",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 567.08
      },
      {
        "num": "67828",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 930.84
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-30",
        "invoices": "",
        "amount": 2246.96
      }
    ],
    "adjustments": []
  },
  {
    "key": "info-telecom-shpk",
    "name": "INFO-TELECOM SHPK",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000065",
    "accountId": "50a0a000-0000-4000-8000-000000000065",
    "sales": [
      {
        "num": "143748",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 32418.95
      }
    ],
    "purchases": [
      {
        "num": "Expected",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 55668.46
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ingenuity-telecom-llc",
    "name": "INGENUITY TELECOM LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000066",
    "accountId": "50a0a000-0000-4000-8000-000000000066",
    "sales": [],
    "purchases": [
      {
        "num": "201",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 422.42
      },
      {
        "num": "202",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 6.86
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "innovantics-ltd",
    "name": "INNOVANTICS LTD",
    "term": 0,
    "contactId": "50a0c000-0000-4000-8000-000000000067",
    "accountId": "50a0a000-0000-4000-8000-000000000067",
    "sales": [],
    "purchases": [
      {
        "num": "2356",
        "start": "2026-03-16",
        "end": "2026-03-23",
        "amount": 970.74
      },
      {
        "num": "2371",
        "start": "2026-03-23",
        "end": "2026-03-30",
        "amount": 819.83
      },
      {
        "num": "2386",
        "start": "2026-03-31",
        "end": "2026-04-06",
        "amount": 259.64
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-04-19",
        "invoices": "",
        "amount": 2050.21
      }
    ],
    "adjustments": []
  },
  {
    "key": "latino-communications",
    "name": "LATINO COMMUNICATIONS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000068",
    "accountId": "50a0a000-0000-4000-8000-000000000068",
    "sales": [
      {
        "num": "143466",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 58.35
      }
    ],
    "purchases": [
      {
        "num": "2026-51776",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 1249.95
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "mainberg-limited",
    "name": "MAINBERG LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000069",
    "accountId": "50a0a000-0000-4000-8000-000000000069",
    "sales": [],
    "purchases": [
      {
        "num": "215717",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 0.06
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "mkel-networks-limited",
    "name": "MKEL NETWORKS LIMITED",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000070",
    "accountId": "50a0a000-0000-4000-8000-000000000070",
    "sales": [
      {
        "num": "143550",
        "start": "2026-07-20",
        "end": "2026-07-26",
        "amount": 364.21
      }
    ],
    "purchases": [
      {
        "num": "20072026-005",
        "start": "2026-07-20",
        "end": "2026-07-26",
        "amount": 8780.81
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "mleta-telecom-ltd",
    "name": "MLETA TELECOM LTD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000071",
    "accountId": "50a0a000-0000-4000-8000-000000000071",
    "sales": [],
    "purchases": [
      {
        "num": "519016",
        "start": "2025-08-01",
        "end": "2025-08-15",
        "amount": 0.47
      },
      {
        "num": "519017",
        "start": "2025-08-16",
        "end": "2025-08-31",
        "amount": 0.25
      },
      {
        "num": "519018",
        "start": "2025-09-01",
        "end": "2025-09-15",
        "amount": 2.31
      },
      {
        "num": "519019",
        "start": "2025-09-16",
        "end": "2025-09-30",
        "amount": 4.12
      },
      {
        "num": "519020",
        "start": "2025-10-01",
        "end": "2025-10-15",
        "amount": 2.58
      },
      {
        "num": "519021",
        "start": "2025-10-16",
        "end": "2025-10-31",
        "amount": 1.32
      },
      {
        "num": "519022",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 1.06
      },
      {
        "num": "519023",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 2.27
      },
      {
        "num": "519024",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 0.72
      },
      {
        "num": "519025",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 0.11
      },
      {
        "num": "519026",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 86.63
      },
      {
        "num": "519027",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 196.05
      },
      {
        "num": "519028",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 183.77
      },
      {
        "num": "519029",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 173.01
      },
      {
        "num": "519030",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 86.37
      },
      {
        "num": "519031",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 109.24
      },
      {
        "num": "519032",
        "start": "2026-07-01",
        "end": "2026-07-15",
        "amount": 259.7
      },
      {
        "num": "519033",
        "start": "2026-07-16",
        "end": "2026-07-31",
        "amount": 531.59
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "mobik-d-o",
    "name": "MOBIK D.O.O",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000072",
    "accountId": "50a0a000-0000-4000-8000-000000000072",
    "sales": [
      {
        "num": "138525",
        "start": "2025-08-01",
        "end": "2025-08-15",
        "amount": 0.1
      }
    ],
    "purchases": [
      {
        "num": "Expected",
        "start": "2025-08-01",
        "end": "2025-08-15",
        "amount": 0.37
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "mtn-globalconnect-solutions",
    "name": "MTN GLOBALCONNECT SOLUTIONS LIMITED (BAYOBAB SOLUTIONS)",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000073",
    "accountId": "50a0a000-0000-4000-8000-000000000073",
    "sales": [
      {
        "num": "143263",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 646.36
      }
    ],
    "purchases": [
      {
        "num": "GC/YCVCE/26/4667",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 10058.55
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-30",
        "invoices": "",
        "amount": 9412.19
      }
    ],
    "adjustments": []
  },
  {
    "key": "nexzen-communication",
    "name": "NEXZEN COMMUNICATION",
    "term": 3,
    "contactId": "50a0c000-0000-4000-8000-000000000074",
    "accountId": "50a0a000-0000-4000-8000-000000000074",
    "sales": [],
    "purchases": [
      {
        "num": " Hayo-202142",
        "start": "2024-02-19",
        "end": "2024-02-25",
        "amount": 840.69
      },
      {
        "num": "Hayo-202148",
        "start": "2024-04-01",
        "end": "2024-04-07",
        "amount": 6.98
      },
      {
        "num": "Hayo-202160",
        "start": "2024-07-01",
        "end": "2024-07-07",
        "amount": 1
      },
      {
        "num": "Hayo-202157",
        "start": "2024-06-03",
        "end": "2024-06-09",
        "amount": 4.45
      },
      {
        "num": "Hayo-202143",
        "start": "2024-02-26",
        "end": "2024-03-03",
        "amount": 603.31
      },
      {
        "num": "Hayo-202144",
        "start": "2024-03-04",
        "end": "2024-03-10",
        "amount": 262.36
      },
      {
        "num": "Hayo-202145",
        "start": "2024-03-11",
        "end": "2024-03-17",
        "amount": 105.72
      },
      {
        "num": "Hayo-202146",
        "start": "2024-03-18",
        "end": "2024-03-24",
        "amount": 60.4
      },
      {
        "num": "Hayo-202147",
        "start": "2024-03-25",
        "end": "2024-03-31",
        "amount": 28.2
      },
      {
        "num": "Hayo-202149",
        "start": "2024-04-08",
        "end": "2024-04-14",
        "amount": 0.86
      },
      {
        "num": "Hayo-202150",
        "start": "2024-04-15",
        "end": "2024-04-21",
        "amount": 1.33
      },
      {
        "num": "Hayo-202151",
        "start": "2024-04-22",
        "end": "2024-04-28",
        "amount": 2.04
      },
      {
        "num": "Hayo-202152",
        "start": "2024-04-29",
        "end": "2024-05-05",
        "amount": 5.82
      },
      {
        "num": "Hayo-202153",
        "start": "2024-05-06",
        "end": "2024-05-12",
        "amount": 3.59
      },
      {
        "num": "Hayo-202154",
        "start": "2024-05-13",
        "end": "2024-05-19",
        "amount": 7.4
      },
      {
        "num": "Hayo-202159",
        "start": "2024-05-17",
        "end": "2024-05-23",
        "amount": 5.35
      },
      {
        "num": "Hayo-202155",
        "start": "2024-05-20",
        "end": "2024-05-26",
        "amount": 8.66
      },
      {
        "num": "Hayo-202156",
        "start": "2024-05-27",
        "end": "2024-06-02",
        "amount": 2.15
      },
      {
        "num": "Hayo-202158",
        "start": "2024-06-10",
        "end": "2024-06-16",
        "amount": 7.43
      },
      {
        "num": "Hayo-202161",
        "start": "2024-10-07",
        "end": "2024-10-13",
        "amount": 0.08
      },
      {
        "num": "Hayo-202162",
        "start": "2024-12-23",
        "end": "2024-12-29",
        "amount": 1257.07
      },
      {
        "num": "Hayo-202163",
        "start": "2024-12-30",
        "end": "2025-01-05",
        "amount": 2872.01
      },
      {
        "num": "Hayo-202164",
        "start": "2025-01-06",
        "end": "2025-01-12",
        "amount": 296.11
      },
      {
        "num": "Hayo-202165",
        "start": "2025-01-13",
        "end": "2025-01-19",
        "amount": 57.84
      },
      {
        "num": "Hayo-202166",
        "start": "2025-01-20",
        "end": "2025-01-26",
        "amount": 7.79
      },
      {
        "num": "Hayo-202167",
        "start": "2025-01-27",
        "end": "2025-02-02",
        "amount": 35.95
      },
      {
        "num": "Hayo-202168",
        "start": "2025-02-03",
        "end": "2025-02-09",
        "amount": 29.17
      },
      {
        "num": "Hayo-202169",
        "start": "2025-04-07",
        "end": "2025-04-13",
        "amount": 0.95
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-01-19",
        "invoices": "",
        "amount": 6514.71
      }
    ],
    "adjustments": []
  },
  {
    "key": "orange-international-carriers",
    "name": "ORANGE INTERNATIONAL CARRIERS",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000075",
    "accountId": "50a0a000-0000-4000-8000-000000000075",
    "sales": [
      {
        "num": "142749",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 1043.48
      },
      {
        "num": "142827",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 54655.59
      },
      {
        "num": "143205",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1067.14
      },
      {
        "num": "143262",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 65871.36
      }
    ],
    "purchases": [
      {
        "num": "5210547208",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 10488.62
      },
      {
        "num": "5210549113",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 16255.31
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "coperato",
    "name": "COPERATO",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000076",
    "accountId": "50a0a000-0000-4000-8000-000000000076",
    "sales": [
      {
        "num": "124218",
        "start": "2022-12-05",
        "end": "2022-12-11",
        "amount": 0.13
      },
      {
        "num": "124219",
        "start": "2022-12-12",
        "end": "2022-12-18",
        "amount": 1.54
      },
      {
        "num": "124220",
        "start": "2022-12-19",
        "end": "2022-12-25",
        "amount": 391.54
      },
      {
        "num": "124221",
        "start": "2022-12-26",
        "end": "2023-01-01",
        "amount": 1389.35
      },
      {
        "num": "124222",
        "start": "2023-01-02",
        "end": "2023-01-08",
        "amount": 1391.24
      },
      {
        "num": "124340",
        "start": "2023-01-09",
        "end": "2023-01-15",
        "amount": 1837.12
      },
      {
        "num": "124397",
        "start": "2023-01-16",
        "end": "2023-01-22",
        "amount": 928.91
      },
      {
        "num": "124406",
        "start": "2023-01-23",
        "end": "2023-01-29",
        "amount": 908.45
      },
      {
        "num": "124655",
        "start": "2023-01-30",
        "end": "2023-02-05",
        "amount": 808.84
      },
      {
        "num": "124696",
        "start": "2023-02-06",
        "end": "2023-02-12",
        "amount": 772.55
      },
      {
        "num": "124841",
        "start": "2023-02-13",
        "end": "2023-02-19",
        "amount": 536.52
      },
      {
        "num": "124882",
        "start": "2023-02-20",
        "end": "2023-02-26",
        "amount": 540.9
      },
      {
        "num": "125056",
        "start": "2023-02-27",
        "end": "2023-03-05",
        "amount": 541.54
      },
      {
        "num": "125094",
        "start": "2023-03-06",
        "end": "2023-03-12",
        "amount": 467.37
      },
      {
        "num": "125230",
        "start": "2023-03-13",
        "end": "2023-03-19",
        "amount": 1309.5
      },
      {
        "num": "125272",
        "start": "2023-03-20",
        "end": "2023-03-26",
        "amount": 1499.8
      },
      {
        "num": "125456",
        "start": "2023-03-27",
        "end": "2023-04-02",
        "amount": 1313.39
      },
      {
        "num": "125501",
        "start": "2023-04-03",
        "end": "2023-04-09",
        "amount": 1455.89
      },
      {
        "num": "125647",
        "start": "2023-04-10",
        "end": "2023-04-16",
        "amount": 1572.29
      },
      {
        "num": "125720",
        "start": "2023-04-17",
        "end": "2023-04-23",
        "amount": 1675.06
      },
      {
        "num": "125887",
        "start": "2023-04-24",
        "end": "2023-04-30",
        "amount": 1958.91
      },
      {
        "num": "125951",
        "start": "2023-05-01",
        "end": "2023-05-07",
        "amount": 2082.81
      },
      {
        "num": "125993",
        "start": "2023-05-08",
        "end": "2023-05-14",
        "amount": 2232
      },
      {
        "num": "126141",
        "start": "2023-05-15",
        "end": "2023-05-21",
        "amount": 2318.18
      },
      {
        "num": "126180",
        "start": "2023-05-22",
        "end": "2023-05-28",
        "amount": 2389.46
      },
      {
        "num": "126373",
        "start": "2023-05-29",
        "end": "2023-06-04",
        "amount": 1938.82
      },
      {
        "num": "126385",
        "start": "2023-06-05",
        "end": "2023-06-11",
        "amount": 2415.27
      },
      {
        "num": "126546",
        "start": "2023-06-12",
        "end": "2023-06-18",
        "amount": 2396.37
      },
      {
        "num": "126611",
        "start": "2023-06-19",
        "end": "2023-06-25",
        "amount": 2368.53
      },
      {
        "num": "126806",
        "start": "2023-06-26",
        "end": "2023-07-02",
        "amount": 1680.09
      },
      {
        "num": "126857",
        "start": "2023-07-03",
        "end": "2023-07-09",
        "amount": 2803.77
      },
      {
        "num": "127023",
        "start": "2023-07-10",
        "end": "2023-07-16",
        "amount": 2435.95
      },
      {
        "num": "127074",
        "start": "2023-07-17",
        "end": "2023-07-23",
        "amount": 2642.98
      },
      {
        "num": "127115",
        "start": "2023-07-24",
        "end": "2023-07-30",
        "amount": 2577.15
      },
      {
        "num": "127337",
        "start": "2023-07-31",
        "end": "2023-08-06",
        "amount": 1728.07
      },
      {
        "num": "127381",
        "start": "2023-08-07",
        "end": "2023-08-13",
        "amount": 2069.81
      },
      {
        "num": "127528",
        "start": "2023-08-14",
        "end": "2023-08-20",
        "amount": 2147.5
      },
      {
        "num": "127566",
        "start": "2023-08-21",
        "end": "2023-08-27",
        "amount": 2138.5
      },
      {
        "num": "127770",
        "start": "2023-08-28",
        "end": "2023-09-03",
        "amount": 1924.32
      },
      {
        "num": "127813",
        "start": "2023-09-04",
        "end": "2023-09-10",
        "amount": 1845.15
      },
      {
        "num": "127971",
        "start": "2023-09-11",
        "end": "2023-09-17",
        "amount": 2054.61
      },
      {
        "num": "128017",
        "start": "2023-09-18",
        "end": "2023-09-24",
        "amount": 2211.42
      },
      {
        "num": "128226",
        "start": "2023-09-25",
        "end": "2023-10-01",
        "amount": 1951.33
      },
      {
        "num": "128278",
        "start": "2023-10-02",
        "end": "2023-10-08",
        "amount": 1935.3
      },
      {
        "num": "128403",
        "start": "2023-10-09",
        "end": "2023-10-15",
        "amount": 1523.59
      },
      {
        "num": "128447",
        "start": "2023-10-16",
        "end": "2023-10-22",
        "amount": 1651.67
      },
      {
        "num": "128491",
        "start": "2023-10-23",
        "end": "2023-10-29",
        "amount": 1705.19
      },
      {
        "num": "128705",
        "start": "2023-10-30",
        "end": "2023-11-05",
        "amount": 1612.43
      },
      {
        "num": "128752",
        "start": "2023-11-06",
        "end": "2023-11-12",
        "amount": 1813.15
      },
      {
        "num": "128902",
        "start": "2023-11-13",
        "end": "2023-11-19",
        "amount": 922.25
      },
      {
        "num": "128943",
        "start": "2023-11-20",
        "end": "2023-11-26",
        "amount": 782.6
      },
      {
        "num": "129149",
        "start": "2023-11-27",
        "end": "2023-12-03",
        "amount": 750.53
      },
      {
        "num": "129176",
        "start": "2023-12-04",
        "end": "2023-12-10",
        "amount": 753.88
      },
      {
        "num": "129330",
        "start": "2023-12-11",
        "end": "2023-12-17",
        "amount": 669.95
      },
      {
        "num": "129391",
        "start": "2023-12-18",
        "end": "2023-12-24",
        "amount": 631.93
      },
      {
        "num": "129502",
        "start": "2023-12-25",
        "end": "2023-12-31",
        "amount": 768.41
      },
      {
        "num": "129657",
        "start": "2024-01-01",
        "end": "2024-01-07",
        "amount": 2386.7
      },
      {
        "num": "129696",
        "start": "2024-01-08",
        "end": "2024-01-14",
        "amount": 2879.4
      },
      {
        "num": "129882",
        "start": "2024-01-15",
        "end": "2024-01-21",
        "amount": 2456.03
      },
      {
        "num": "129925",
        "start": "2024-01-22",
        "end": "2024-01-28",
        "amount": 2596.13
      },
      {
        "num": "130137",
        "start": "2024-01-29",
        "end": "2024-02-04",
        "amount": 2453.3
      },
      {
        "num": "130182",
        "start": "2024-02-05",
        "end": "2024-02-11",
        "amount": 2826.57
      },
      {
        "num": "130340",
        "start": "2024-02-12",
        "end": "2024-02-18",
        "amount": 2450.93
      },
      {
        "num": "130375",
        "start": "2024-02-19",
        "end": "2024-02-25",
        "amount": 2624.65
      },
      {
        "num": "130580",
        "start": "2024-02-26",
        "end": "2024-03-03",
        "amount": 1866.33
      },
      {
        "num": "130620",
        "start": "2024-03-04",
        "end": "2024-03-10",
        "amount": 1123.81
      },
      {
        "num": "130774",
        "start": "2024-03-11",
        "end": "2024-03-17",
        "amount": 631.28
      },
      {
        "num": "130811",
        "start": "2024-03-18",
        "end": "2024-03-24",
        "amount": 496.66
      },
      {
        "num": "130874",
        "start": "2024-03-25",
        "end": "2024-03-31",
        "amount": 405.52
      },
      {
        "num": "131051",
        "start": "2024-04-01",
        "end": "2024-04-07",
        "amount": 174.84
      },
      {
        "num": "131093",
        "start": "2024-04-08",
        "end": "2024-04-14",
        "amount": 19.7
      },
      {
        "num": "131264",
        "start": "2024-04-15",
        "end": "2024-04-21",
        "amount": 65.88
      },
      {
        "num": "131305",
        "start": "2024-04-22",
        "end": "2024-04-28",
        "amount": 39.25
      },
      {
        "num": "131521",
        "start": "2024-04-29",
        "end": "2024-05-05",
        "amount": 54.69
      },
      {
        "num": "131560",
        "start": "2024-05-06",
        "end": "2024-05-12",
        "amount": 184.03
      },
      {
        "num": "131701",
        "start": "2024-05-13",
        "end": "2024-05-19",
        "amount": 918.38
      },
      {
        "num": "131733",
        "start": "2024-05-20",
        "end": "2024-05-26",
        "amount": 1222.98
      },
      {
        "num": "131940",
        "start": "2024-05-27",
        "end": "2024-06-02",
        "amount": 1279.9
      },
      {
        "num": "131976",
        "start": "2024-06-03",
        "end": "2024-06-09",
        "amount": 1250.96
      },
      {
        "num": "132118",
        "start": "2024-06-10",
        "end": "2024-06-16",
        "amount": 923.2
      },
      {
        "num": "132153",
        "start": "2024-06-17",
        "end": "2024-06-23",
        "amount": 1244.99
      },
      {
        "num": "132238",
        "start": "2024-06-24",
        "end": "2024-06-30",
        "amount": 940.62
      },
      {
        "num": "132413",
        "start": "2024-07-01",
        "end": "2024-07-07",
        "amount": 977.57
      },
      {
        "num": "132450",
        "start": "2024-07-08",
        "end": "2024-07-14",
        "amount": 1008.33
      },
      {
        "num": "132605",
        "start": "2024-07-15",
        "end": "2024-07-21",
        "amount": 1144.14
      },
      {
        "num": "132652",
        "start": "2024-07-22",
        "end": "2024-07-28",
        "amount": 1144.97
      },
      {
        "num": "132863",
        "start": "2024-07-29",
        "end": "2024-08-04",
        "amount": 913.81
      },
      {
        "num": "132901",
        "start": "2024-08-05",
        "end": "2024-08-11",
        "amount": 992.09
      },
      {
        "num": "133038",
        "start": "2024-08-12",
        "end": "2024-08-18",
        "amount": 958.97
      },
      {
        "num": "133076",
        "start": "2024-08-19",
        "end": "2024-08-25",
        "amount": 660.94
      },
      {
        "num": "133296",
        "start": "2024-08-26",
        "end": "2024-09-01",
        "amount": 602.28
      },
      {
        "num": "133345",
        "start": "2024-09-02",
        "end": "2024-09-08",
        "amount": 901.75
      },
      {
        "num": "133511",
        "start": "2024-09-09",
        "end": "2024-09-15",
        "amount": 697.89
      },
      {
        "num": "133573",
        "start": "2024-09-16",
        "end": "2024-09-22",
        "amount": 436.03
      },
      {
        "num": "133596",
        "start": "2024-09-23",
        "end": "2024-09-29",
        "amount": 425.16
      },
      {
        "num": "133816",
        "start": "2024-09-30",
        "end": "2024-10-06",
        "amount": 460.25
      },
      {
        "num": "133862",
        "start": "2024-10-07",
        "end": "2024-10-13",
        "amount": 619.21
      },
      {
        "num": "134020",
        "start": "2024-10-14",
        "end": "2024-10-20",
        "amount": 802.12
      },
      {
        "num": "134074",
        "start": "2024-10-21",
        "end": "2024-10-27",
        "amount": 751.91
      },
      {
        "num": "134291",
        "start": "2024-10-28",
        "end": "2024-11-03",
        "amount": 928.7
      },
      {
        "num": "134324",
        "start": "2024-11-04",
        "end": "2024-11-10",
        "amount": 858.78
      },
      {
        "num": "134480",
        "start": "2024-11-11",
        "end": "2024-11-17",
        "amount": 618.51
      },
      {
        "num": "134512",
        "start": "2024-11-18",
        "end": "2024-11-24",
        "amount": 540.92
      },
      {
        "num": "134718",
        "start": "2024-11-25",
        "end": "2024-12-01",
        "amount": 606.79
      },
      {
        "num": "134768",
        "start": "2024-12-02",
        "end": "2024-12-08",
        "amount": 464.69
      },
      {
        "num": "134854",
        "start": "2024-12-09",
        "end": "2024-12-15",
        "amount": 587.6
      },
      {
        "num": "134958",
        "start": "2024-12-16",
        "end": "2024-12-22",
        "amount": 395.3
      },
      {
        "num": "134985",
        "start": "2024-12-23",
        "end": "2024-12-29",
        "amount": 234.41
      },
      {
        "num": "135108",
        "start": "2024-12-30",
        "end": "2024-12-31",
        "amount": 140.13
      },
      {
        "num": "135223",
        "start": "2025-01-01",
        "end": "2025-01-05",
        "amount": 101.62
      },
      {
        "num": "135257",
        "start": "2025-01-06",
        "end": "2025-01-12",
        "amount": 468.3
      },
      {
        "num": "135415",
        "start": "2025-01-13",
        "end": "2025-01-19",
        "amount": 674.45
      },
      {
        "num": "135460",
        "start": "2025-01-20",
        "end": "2025-01-26",
        "amount": 666.38
      },
      {
        "num": "135699",
        "start": "2025-01-27",
        "end": "2025-02-02",
        "amount": 769.24
      },
      {
        "num": "135738",
        "start": "2025-02-03",
        "end": "2025-02-09",
        "amount": 1024.4
      },
      {
        "num": "135896",
        "start": "2025-02-10",
        "end": "2025-02-16",
        "amount": 924.48
      },
      {
        "num": "135932",
        "start": "2025-02-17",
        "end": "2025-02-23",
        "amount": 1127.95
      },
      {
        "num": "136150",
        "start": "2025-02-24",
        "end": "2025-03-02",
        "amount": 710.06
      },
      {
        "num": "136184",
        "start": "2025-03-03",
        "end": "2025-03-09",
        "amount": 702.28
      },
      {
        "num": "136335",
        "start": "2025-03-10",
        "end": "2025-03-16",
        "amount": 788.84
      },
      {
        "num": "136365",
        "start": "2025-03-17",
        "end": "2025-03-23",
        "amount": 493.15
      },
      {
        "num": "136395",
        "start": "2025-03-24",
        "end": "2025-03-30",
        "amount": 218.75
      },
      {
        "num": "136609",
        "start": "2025-03-31",
        "end": "2025-04-06",
        "amount": 256.58
      },
      {
        "num": "136640",
        "start": "2025-04-07",
        "end": "2025-04-13",
        "amount": 553.31
      },
      {
        "num": "136790",
        "start": "2025-04-14",
        "end": "2025-04-20",
        "amount": 362.43
      },
      {
        "num": "136822",
        "start": "2025-04-21",
        "end": "2025-04-27",
        "amount": 314.2
      },
      {
        "num": "137018",
        "start": "2025-04-28",
        "end": "2025-04-04",
        "amount": 302.72
      },
      {
        "num": "137073",
        "start": "2025-05-05",
        "end": "2025-05-11",
        "amount": 360.71
      },
      {
        "num": "137223",
        "start": "2025-05-12",
        "end": "2025-05-18",
        "amount": 315.05
      },
      {
        "num": "137256",
        "start": "2025-05-19",
        "end": "2025-05-25",
        "amount": 266.77
      },
      {
        "num": "137473",
        "start": "2025-05-26",
        "end": "2025-06-01",
        "amount": 288.3
      },
      {
        "num": "137497",
        "start": "2025-06-02",
        "end": "2025-06-08",
        "amount": 183
      },
      {
        "num": "137530",
        "start": "2025-06-09",
        "end": "2025-06-15",
        "amount": 217.15
      },
      {
        "num": "137656",
        "start": "2025-06-16",
        "end": "2025-06-22",
        "amount": 212.86
      },
      {
        "num": "137693",
        "start": "2025-06-23",
        "end": "2025-06-29",
        "amount": 199.69
      },
      {
        "num": "137917",
        "start": "2025-06-30",
        "end": "2025-07-06",
        "amount": 697.36
      },
      {
        "num": "137953",
        "start": "2025-07-07",
        "end": "2025-07-13",
        "amount": 384.86
      },
      {
        "num": "138103",
        "start": "2025-07-14",
        "end": "2025-07-20",
        "amount": 147.17
      },
      {
        "num": "138126",
        "start": "2025-07-21",
        "end": "2025-07-27",
        "amount": 164.82
      },
      {
        "num": "138350",
        "start": "2025-07-28",
        "end": "2025-08-03",
        "amount": 161.27
      },
      {
        "num": "138396",
        "start": "2025-08-04",
        "end": "2025-08-10",
        "amount": 172.46
      },
      {
        "num": "138552",
        "start": "2025-08-11",
        "end": "2025-08-17",
        "amount": 269.18
      },
      {
        "num": "138593",
        "start": "2025-08-18",
        "end": "2025-08-24",
        "amount": 418.65
      },
      {
        "num": "138709",
        "start": "2025-08-25",
        "end": "2025-08-31",
        "amount": 428.08
      },
      {
        "num": "138847",
        "start": "2025-09-01",
        "end": "2025-09-07",
        "amount": 348.22
      },
      {
        "num": "138881",
        "start": "2025-09-08",
        "end": "2025-09-14",
        "amount": 350.66
      },
      {
        "num": "139033",
        "start": "2025-09-15",
        "end": "2025-09-21",
        "amount": 595.07
      },
      {
        "num": "139063",
        "start": "2025-09-22",
        "end": "2025-09-28",
        "amount": 592.04
      },
      {
        "num": "139289",
        "start": "2025-09-29",
        "end": "2025-10-05",
        "amount": 108.22
      },
      {
        "num": "139324",
        "start": "2025-10-06",
        "end": "2025-10-12",
        "amount": 68.62
      },
      {
        "num": "139474",
        "start": "2025-10-13",
        "end": "2025-10-19",
        "amount": 118.52
      },
      {
        "num": "139507",
        "start": "2025-10-20",
        "end": "2025-10-26",
        "amount": 195.84
      },
      {
        "num": "139724",
        "start": "2025-10-27",
        "end": "2025-11-02",
        "amount": 159.06
      },
      {
        "num": "139758",
        "start": "2025-11-03",
        "end": "2025-11-09",
        "amount": 151.26
      },
      {
        "num": "139911",
        "start": "2025-11-10",
        "end": "2025-11-16",
        "amount": 95.47
      },
      {
        "num": "139945",
        "start": "2025-11-17",
        "end": "2025-11-23",
        "amount": 89.51
      },
      {
        "num": "140068",
        "start": "2025-11-24",
        "end": "2025-11-30",
        "amount": 86.08
      },
      {
        "num": "140193",
        "start": "2025-12-01",
        "end": "2025-12-07",
        "amount": 79.7
      },
      {
        "num": "140227",
        "start": "2025-12-08",
        "end": "2025-12-14",
        "amount": 121.32
      },
      {
        "num": "140374",
        "start": "2025-12-15",
        "end": "2025-12-21",
        "amount": 86.25
      },
      {
        "num": "140405",
        "start": "2025-12-22",
        "end": "2025-12-28",
        "amount": 28.17
      },
      {
        "num": "140619",
        "start": "2025-12-29",
        "end": "2025-12-31",
        "amount": 15.22
      },
      {
        "num": "140645",
        "start": "2026-01-01",
        "end": "2026-01-04",
        "amount": 1.75
      },
      {
        "num": "140678",
        "start": "2026-01-05",
        "end": "2026-01-11",
        "amount": 68.96
      },
      {
        "num": "140827",
        "start": "2026-01-12",
        "end": "2026-01-18",
        "amount": 96.18
      },
      {
        "num": "140863",
        "start": "2026-01-19",
        "end": "2026-01-25",
        "amount": 112.95
      },
      {
        "num": "141077",
        "start": "2026-01-26",
        "end": "2026-02-01",
        "amount": 111.9
      },
      {
        "num": "141110",
        "start": "2026-02-02",
        "end": "2026-02-08",
        "amount": 64.07
      },
      {
        "num": "141228",
        "start": "2026-02-09",
        "end": "2026-02-15",
        "amount": 49.94
      },
      {
        "num": "141296",
        "start": "2026-02-16",
        "end": "2026-02-22",
        "amount": 44.58
      },
      {
        "num": "141511",
        "start": "2026-02-23",
        "end": "2026-03-01",
        "amount": 53.53
      },
      {
        "num": "141544",
        "start": "2026-03-02",
        "end": "2026-03-08",
        "amount": 85.97
      },
      {
        "num": "141665",
        "start": "2026-03-09",
        "end": "2026-03-15",
        "amount": 62.63
      },
      {
        "num": "141732",
        "start": "2026-03-16",
        "end": "2026-03-22",
        "amount": 71.72
      },
      {
        "num": "141763",
        "start": "2026-03-23",
        "end": "2026-03-29",
        "amount": 159.18
      },
      {
        "num": "141980",
        "start": "2026-03-30",
        "end": "2026-04-05",
        "amount": 79.1
      },
      {
        "num": "141999",
        "start": "2026-04-06",
        "end": "2026-04-12",
        "amount": 85.93
      },
      {
        "num": "142149",
        "start": "2026-04-13",
        "end": "2026-04-19",
        "amount": 1.71
      },
      {
        "num": "142183",
        "start": "2026-04-20",
        "end": "2026-04-26",
        "amount": 205.21
      },
      {
        "num": "142395",
        "start": "2026-04-27",
        "end": "2026-05-03",
        "amount": 151.57
      },
      {
        "num": "142430",
        "start": "2026-05-04",
        "end": "2026-05-10",
        "amount": 96.59
      },
      {
        "num": "142576",
        "start": "2026-05-11",
        "end": "2026-05-17",
        "amount": 114.94
      },
      {
        "num": "142641",
        "start": "2026-05-18",
        "end": "2026-05-24",
        "amount": 122.06
      },
      {
        "num": "142680",
        "start": "2026-05-25",
        "end": "2026-05-31",
        "amount": 142.93
      },
      {
        "num": "142874",
        "start": "2026-06-01",
        "end": "2026-06-07",
        "amount": 118.92
      },
      {
        "num": "142908",
        "start": "2026-06-08",
        "end": "2026-06-14",
        "amount": 45.39
      },
      {
        "num": "143058",
        "start": "2026-06-15",
        "end": "2026-06-21",
        "amount": 63.59
      },
      {
        "num": "143092",
        "start": "2026-06-22",
        "end": "2026-06-28",
        "amount": 58.14
      },
      {
        "num": "143318",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 75.31
      },
      {
        "num": "143352",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 92.49
      },
      {
        "num": "143496",
        "start": "2026-07-13",
        "end": "2026-07-19",
        "amount": 40.33
      },
      {
        "num": "143568",
        "start": "2026-07-20",
        "end": "2026-07-26",
        "amount": 41.78
      },
      {
        "num": "143790",
        "start": "2026-07-27",
        "end": "2026-08-02",
        "amount": 35.85
      },
      {
        "num": "143823",
        "start": "2026-08-03",
        "end": "2026-08-09",
        "amount": 46.65
      }
    ],
    "purchases": [],
    "receipts": [
      {
        "date": "2022-12-08",
        "invoices": "",
        "amount": 150
      },
      {
        "date": "2022-12-22",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2023-01-05",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2023-01-11",
        "invoices": "",
        "amount": 15000
      },
      {
        "date": "2023-05-01",
        "invoices": "",
        "amount": 4775.5
      },
      {
        "date": "2023-05-02",
        "invoices": "",
        "amount": 10000
      },
      {
        "date": "2023-05-12",
        "invoices": "",
        "amount": 15000
      },
      {
        "date": "2023-07-26",
        "invoices": "",
        "amount": 4775.5
      },
      {
        "date": "2023-08-10",
        "invoices": "",
        "amount": 15000
      },
      {
        "date": "2023-10-03",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2023-10-17",
        "invoices": "",
        "amount": 3820.4
      },
      {
        "date": "2023-11-01",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2023-11-14",
        "invoices": "",
        "amount": 3820.4
      },
      {
        "date": "2023-12-18",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-01-04",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-01-11",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-01-17",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-01-24",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-02-01",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-02-07",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-02-15",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-02-23",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-03-06",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-04-10",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-05-15",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-05-28",
        "invoices": "",
        "amount": 2865.3
      },
      {
        "date": "2024-06-12",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-06-17",
        "invoices": "",
        "amount": 4775.5
      },
      {
        "date": "2024-07-28",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-08-12",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-08-18",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2024-09-05",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-09-16",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-09-30",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-10-11",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-10-22",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-10-29",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-11-05",
        "invoices": "",
        "amount": 1432.65
      },
      {
        "date": "2024-11-21",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-12-03",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2024-12-16",
        "invoices": "",
        "amount": 477.55
      },
      {
        "date": "2024-12-24",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-01-14",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-01-23",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-02-02",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-02-07",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-02-14",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-02-20",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-02-27",
        "invoices": "",
        "amount": 1910.2
      },
      {
        "date": "2025-03-20",
        "invoices": "",
        "amount": 1432.65
      },
      {
        "date": "2025-04-15",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-05-07",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-05-29",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-05-29",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-07-13",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-08-17",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-09-03",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-09-09",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-10-01",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2025-12-04",
        "invoices": "",
        "amount": 1432.65
      },
      {
        "date": "2026-04-17",
        "invoices": "",
        "amount": 955.1
      },
      {
        "date": "2026-06-10",
        "invoices": "",
        "amount": 1000
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "glo-carrier",
    "name": "GLO CARRIER",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000077",
    "accountId": "50a0a000-0000-4000-8000-000000000077",
    "sales": [
      {
        "num": "121597",
        "start": "2022-06-01",
        "end": "2022-06-30",
        "amount": 0.35
      },
      {
        "num": "122334",
        "start": "2022-08-01",
        "end": "2022-08-31",
        "amount": 4512.24
      },
      {
        "num": "122760",
        "start": "2022-09-01",
        "end": "2022-09-30",
        "amount": 314.06
      },
      {
        "num": "123154",
        "start": "2022-10-01",
        "end": "2022-10-31",
        "amount": 5337.57
      },
      {
        "num": "123574",
        "start": "2022-11-01",
        "end": "2022-11-30",
        "amount": 9.87
      },
      {
        "num": "124133",
        "start": "2022-12-01",
        "end": "2022-12-31",
        "amount": 23.67
      },
      {
        "num": "124602",
        "start": "2023-01-01",
        "end": "2023-01-31",
        "amount": 1462.94
      },
      {
        "num": "125019",
        "start": "2023-02-01",
        "end": "2023-02-28",
        "amount": 2740.97
      },
      {
        "num": "125422",
        "start": "2023-03-01",
        "end": "2023-03-31",
        "amount": 6344.41
      },
      {
        "num": "125816",
        "start": "2023-04-01",
        "end": "2023-04-30",
        "amount": 250139.01
      },
      {
        "num": "126264",
        "start": "2023-05-01",
        "end": "2023-05-31",
        "amount": 564012.44
      },
      {
        "num": "126698",
        "start": "2023-06-01",
        "end": "2023-06-30",
        "amount": 176232.87
      },
      {
        "num": "127200",
        "start": "2023-07-01",
        "end": "2023-07-31",
        "amount": 924.22
      },
      {
        "num": "127642",
        "start": "2023-08-01",
        "end": "2023-08-31",
        "amount": 121.19
      },
      {
        "num": "128104",
        "start": "2023-09-01",
        "end": "2023-09-30",
        "amount": 312.27
      },
      {
        "num": "128679",
        "start": "2023-10-01",
        "end": "2023-10-31",
        "amount": 75514.06
      },
      {
        "num": "129123",
        "start": "2023-11-01",
        "end": "2023-11-30",
        "amount": 75110.05
      },
      {
        "num": "129432",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 23.45
      },
      {
        "num": "129988",
        "start": "2024-01-01",
        "end": "2024-01-31",
        "amount": 47.54
      },
      {
        "num": "130539",
        "start": "2024-02-01",
        "end": "2024-02-29",
        "amount": 71.19
      },
      {
        "num": "131018",
        "start": "2024-03-01",
        "end": "2024-03-31",
        "amount": 25.22
      },
      {
        "num": "131492",
        "start": "2024-04-01",
        "end": "2024-04-30",
        "amount": 4.54
      },
      {
        "num": "131865",
        "start": "2024-05-01",
        "end": "2024-05-31",
        "amount": 93.96
      },
      {
        "num": "132324",
        "start": "2024-06-01",
        "end": "2024-06-30",
        "amount": 184.85
      },
      {
        "num": "132818",
        "start": "2024-07-01",
        "end": "2024-07-31",
        "amount": 419.59
      },
      {
        "num": "133171",
        "start": "2024-08-01",
        "end": "2024-08-31",
        "amount": 279.16
      },
      {
        "num": "133664",
        "start": "2024-09-01",
        "end": "2024-09-30",
        "amount": 2.38
      },
      {
        "num": "134187",
        "start": "2024-10-01",
        "end": "2024-10-31",
        "amount": 3.07
      },
      {
        "num": "134633",
        "start": "2024-11-01",
        "end": "2024-11-30",
        "amount": 2.84
      },
      {
        "num": "135150",
        "start": "2024-12-01",
        "end": "2024-12-31",
        "amount": 8.43
      },
      {
        "num": "135648",
        "start": "2025-01-01",
        "end": "2025-01-31",
        "amount": 11.04
      },
      {
        "num": "135943",
        "start": "2025-02-01",
        "end": "2025-02-28",
        "amount": 5.7
      },
      {
        "num": "136425",
        "start": "2025-03-01",
        "end": "2025-03-31",
        "amount": 8.92
      },
      {
        "num": "136851",
        "start": "2025-04-01",
        "end": "2025-04-30",
        "amount": 39.48
      },
      {
        "num": "137397",
        "start": "2025-05-01",
        "end": "2025-05-31",
        "amount": 43.77
      },
      {
        "num": "137874",
        "start": "2025-06-01",
        "end": "2025-06-30",
        "amount": 914.4
      },
      {
        "num": "138314",
        "start": "2025-07-01",
        "end": "2025-07-31",
        "amount": 1160.04
      },
      {
        "num": "138791",
        "start": "2025-08-01",
        "end": "2025-08-31",
        "amount": 640.66
      },
      {
        "num": "139235",
        "start": "2025-09-01",
        "end": "2025-09-30",
        "amount": 369.97
      },
      {
        "num": "139681",
        "start": "2025-10-01",
        "end": "2025-10-31",
        "amount": 27.7
      },
      {
        "num": "140151",
        "start": "2025-11-01",
        "end": "2025-11-30",
        "amount": 6.59
      },
      {
        "num": "140580",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 24.76
      },
      {
        "num": "141033",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 426.41
      },
      {
        "num": "141467",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 462.64
      },
      {
        "num": "141936",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 2353.49
      },
      {
        "num": "142372",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 224.67
      },
      {
        "num": "142854",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 786.53
      },
      {
        "num": "143287",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 531.43
      },
      {
        "num": "143763",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 711.96
      }
    ],
    "purchases": [
      {
        "num": "16082",
        "start": "2022-06-01",
        "end": "2022-06-30",
        "amount": 0.5
      },
      {
        "num": "16374",
        "start": "2022-07-01",
        "end": "2022-07-31",
        "amount": 0.03
      },
      {
        "num": "16695",
        "start": "2022-08-01",
        "end": "2022-08-31",
        "amount": 6.11
      },
      {
        "num": "17019",
        "start": "2022-09-01",
        "end": "2022-09-30",
        "amount": 2584.37
      },
      {
        "num": "17349",
        "start": "2022-10-01",
        "end": "2022-10-31",
        "amount": 3583.41
      },
      {
        "num": "17749",
        "start": "2022-11-01",
        "end": "2022-11-30",
        "amount": 7023.72
      },
      {
        "num": "18022",
        "start": "2022-12-01",
        "end": "2022-12-31",
        "amount": 987.68
      },
      {
        "num": "18354",
        "start": "2023-01-01",
        "end": "2023-01-31",
        "amount": 665.87
      },
      {
        "num": "18659",
        "start": "2023-02-01",
        "end": "2023-02-28",
        "amount": 128.73
      },
      {
        "num": "19049",
        "start": "2023-03-01",
        "end": "2023-03-31",
        "amount": 7950.37
      },
      {
        "num": "19296",
        "start": "2023-04-01",
        "end": "2023-04-30",
        "amount": 252197.15
      },
      {
        "num": "19675",
        "start": "2023-05-01",
        "end": "2023-05-31",
        "amount": 563995.72
      },
      {
        "num": "19973",
        "start": "2023-06-01",
        "end": "2023-06-30",
        "amount": 174573.28
      },
      {
        "num": "20345",
        "start": "2023-07-01",
        "end": "2023-07-31",
        "amount": 2466.75
      },
      {
        "num": "20658",
        "start": "2023-08-01",
        "end": "2023-08-31",
        "amount": 132.78
      },
      {
        "num": "21017",
        "start": "2023-09-01",
        "end": "2023-09-30",
        "amount": 97.53
      },
      {
        "num": "21353",
        "start": "2023-10-01",
        "end": "2023-10-31",
        "amount": 75406.72
      },
      {
        "num": "21680",
        "start": "2023-11-01",
        "end": "2023-11-30",
        "amount": 75320.22
      },
      {
        "num": "22001",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 94.05
      },
      {
        "num": "22340",
        "start": "2024-01-01",
        "end": "2024-01-31",
        "amount": 203.27
      },
      {
        "num": "22651",
        "start": "2024-02-01",
        "end": "2024-02-29",
        "amount": 58.31
      },
      {
        "num": "22990",
        "start": "2024-03-01",
        "end": "2024-03-31",
        "amount": 9.69
      },
      {
        "num": "23329",
        "start": "2024-04-01",
        "end": "2024-04-30",
        "amount": 1.52
      },
      {
        "num": "23668",
        "start": "2024-05-01",
        "end": "2024-05-31",
        "amount": 2.76
      },
      {
        "num": "24007",
        "start": "2024-06-01",
        "end": "2024-06-30",
        "amount": 0.61
      },
      {
        "num": "24346",
        "start": "2024-07-01",
        "end": "2024-07-31",
        "amount": 2.44
      },
      {
        "num": "24683",
        "start": "2024-08-01",
        "end": "2024-08-31",
        "amount": 1.09
      },
      {
        "num": "25028",
        "start": "2024-09-01",
        "end": "2024-09-30",
        "amount": 1.65
      },
      {
        "num": "25403",
        "start": "2024-10-01",
        "end": "2024-10-31",
        "amount": 0.63
      },
      {
        "num": "25744",
        "start": "2024-11-01",
        "end": "2024-11-30",
        "amount": 96.49
      },
      {
        "num": "26051",
        "start": "2024-12-01",
        "end": "2024-12-31",
        "amount": 0.83
      },
      {
        "num": "26391",
        "start": "2025-01-01",
        "end": "2025-01-31",
        "amount": 147.05
      },
      {
        "num": "26744",
        "start": "2025-02-01",
        "end": "2025-02-28",
        "amount": 230.81
      },
      {
        "num": "26855",
        "start": "2025-03-01",
        "end": "2025-03-31",
        "amount": 13.14
      },
      {
        "num": "27400",
        "start": "2025-04-01",
        "end": "2025-04-30",
        "amount": 316.67
      },
      {
        "num": "27604",
        "start": "2025-05-01",
        "end": "2025-05-31",
        "amount": 443.81
      },
      {
        "num": "28096",
        "start": "2025-06-01",
        "end": "2025-06-30",
        "amount": 25.51
      },
      {
        "num": "28432",
        "start": "2025-07-01",
        "end": "2025-07-31",
        "amount": 97.29
      },
      {
        "num": "28823",
        "start": "2025-08-01",
        "end": "2025-08-31",
        "amount": 474.18
      },
      {
        "num": "29027",
        "start": "2025-09-01",
        "end": "2025-09-30",
        "amount": 8.97
      },
      {
        "num": "29504",
        "start": "2025-10-01",
        "end": "2025-10-31",
        "amount": 5.02
      },
      {
        "num": "29862",
        "start": "2025-11-01",
        "end": "2025-11-30",
        "amount": 134.38
      },
      {
        "num": "30216",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 3.29
      },
      {
        "num": "30566",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 8.48
      },
      {
        "num": "30883",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 21.44
      },
      {
        "num": "31236",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 444.59
      },
      {
        "num": "31591",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 4836.29
      },
      {
        "num": "31942",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 1349.55
      },
      {
        "num": "32157",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 531.94
      },
      {
        "num": "Expected",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 715.27
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "go4mobility",
    "name": "GO4MOBILITY",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000078",
    "accountId": "50a0a000-0000-4000-8000-000000000078",
    "sales": [
      {
        "num": "122857",
        "start": "2022-09-01",
        "end": "2022-09-30",
        "amount": 0.05
      },
      {
        "num": "123238",
        "start": "2022-10-01",
        "end": "2022-10-31",
        "amount": 0.06
      },
      {
        "num": "124636",
        "start": "2023-01-01",
        "end": "2023-01-31",
        "amount": 9.43
      },
      {
        "num": "128096",
        "start": "2023-09-01",
        "end": "2023-09-30",
        "amount": 0.45
      },
      {
        "num": "128601",
        "start": "2023-10-01",
        "end": "2023-10-31",
        "amount": 0.13
      },
      {
        "num": "129064",
        "start": "2023-11-01",
        "end": "2023-11-30",
        "amount": 0.21
      },
      {
        "num": "129529",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 0.6
      },
      {
        "num": "130093",
        "start": "2024-01-01",
        "end": "2024-01-31",
        "amount": 1.53
      },
      {
        "num": "130532",
        "start": "2024-02-01",
        "end": "2024-02-29",
        "amount": 12.25
      },
      {
        "num": "131005",
        "start": "2024-03-01",
        "end": "2024-03-31",
        "amount": 0.01
      },
      {
        "num": "131488",
        "start": "2024-04-01",
        "end": "2024-04-30",
        "amount": 0.03
      },
      {
        "num": "131916",
        "start": "2024-05-01",
        "end": "2024-05-31",
        "amount": 1.02
      },
      {
        "num": "132369",
        "start": "2024-06-01",
        "end": "2024-06-30",
        "amount": 0.39
      },
      {
        "num": "133188",
        "start": "2024-07-01",
        "end": "2024-07-31",
        "amount": 52.79
      },
      {
        "num": "138800",
        "start": "2025-08-01",
        "end": "2025-08-31",
        "amount": 9.77
      },
      {
        "num": "139244",
        "start": "2025-09-01",
        "end": "2025-09-30",
        "amount": 1.41
      }
    ],
    "purchases": [
      {
        "num": "10004374",
        "start": "2022-11-01",
        "end": "2022-11-30",
        "amount": 0.74
      },
      {
        "num": "2023440005",
        "start": "2022-12-01",
        "end": "2022-12-31",
        "amount": 1.45
      },
      {
        "num": "2023440062",
        "start": "2023-01-01",
        "end": "2023-01-31",
        "amount": 34.53
      },
      {
        "num": "2023440084",
        "start": "2023-02-01",
        "end": "2023-02-28",
        "amount": 120.9
      },
      {
        "num": "2023410436",
        "start": "2023-03-01",
        "end": "2023-03-31",
        "amount": 144.4
      },
      {
        "num": "2023410444",
        "start": "2023-04-01",
        "end": "2023-04-30",
        "amount": 81.53
      },
      {
        "num": "2023410561",
        "start": "2023-05-01",
        "end": "2023-05-31",
        "amount": 524.38
      },
      {
        "num": "2023410667",
        "start": "2023-06-01",
        "end": "2023-06-30",
        "amount": 702.59
      },
      {
        "num": "2023410772",
        "start": "2023-07-01",
        "end": "2023-07-31",
        "amount": 484.21
      },
      {
        "num": "2023410970",
        "start": "2023-08-01",
        "end": "2023-08-31",
        "amount": 1260.07
      },
      {
        "num": "2023411082",
        "start": "2023-09-01",
        "end": "2023-09-30",
        "amount": 302.98
      },
      {
        "num": "2023411196",
        "start": "2023-10-01",
        "end": "2023-10-31",
        "amount": 15.79
      },
      {
        "num": "2023411216",
        "start": "2023-11-01",
        "end": "2023-11-30",
        "amount": 201.09
      },
      {
        "num": "2024410022",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 2.9
      },
      {
        "num": "2024410140",
        "start": "2024-01-01",
        "end": "2024-01-31",
        "amount": 4
      },
      {
        "num": "2024410262",
        "start": "2024-02-01",
        "end": "2024-02-29",
        "amount": 17.89
      },
      {
        "num": "2024410450",
        "start": "2024-03-01",
        "end": "2024-03-31",
        "amount": 14.89
      },
      {
        "num": "2024410516",
        "start": "2024-04-01",
        "end": "2024-04-30",
        "amount": 0.03
      },
      {
        "num": "2024410629",
        "start": "2024-05-01",
        "end": "2024-05-31",
        "amount": 13.34
      },
      {
        "num": "2024410763",
        "start": "2024-06-01",
        "end": "2024-06-30",
        "amount": 17.47
      },
      {
        "num": "2025411500",
        "start": "2025-10-01",
        "end": "2025-10-31",
        "amount": 1.23
      },
      {
        "num": "2025412123",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 0.28
      }
    ],
    "receipts": [
      {
        "date": "2024-12-16",
        "invoices": "",
        "amount": 46.48
      },
      {
        "date": "2025-12-01",
        "invoices": "",
        "amount": 11.18
      }
    ],
    "payments": [
      {
        "date": "2023-09-29",
        "invoices": "",
        "amount": 3344.52
      },
      {
        "date": "2024-07-19",
        "invoices": "",
        "amount": 574.5
      }
    ],
    "adjustments": []
  },
  {
    "key": "ibasis-global-inc",
    "name": "iBASIS Global, Inc",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000079",
    "accountId": "50a0a000-0000-4000-8000-000000000079",
    "sales": [
      {
        "num": "137313",
        "start": "2025-05-01",
        "end": "2025-05-31",
        "amount": 0.83
      },
      {
        "num": "137808",
        "start": "2025-06-01",
        "end": "2025-06-30",
        "amount": 31.5
      },
      {
        "num": "138287",
        "start": "2025-07-01",
        "end": "2025-07-31",
        "amount": 6071.23
      },
      {
        "num": "138750",
        "start": "2025-08-01",
        "end": "2025-08-31",
        "amount": 11490.03
      },
      {
        "num": "139194",
        "start": "2025-09-01",
        "end": "2025-09-30",
        "amount": 9206.6
      },
      {
        "num": "139663",
        "start": "2025-10-01",
        "end": "2025-10-31",
        "amount": 23587.22
      },
      {
        "num": "140134",
        "start": "2025-11-01",
        "end": "2025-11-30",
        "amount": 25450.63
      },
      {
        "num": "140565",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 29369.19
      },
      {
        "num": "140876",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 34128.34
      },
      {
        "num": "141322",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 27626.71
      },
      {
        "num": "141795",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 26915.39
      },
      {
        "num": "142287",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 34199.15
      },
      {
        "num": "142778",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 77634.86
      },
      {
        "num": "143217",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 79372.37
      },
      {
        "num": "143693",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 88135.76
      }
    ],
    "purchases": [
      {
        "num": "4000349097",
        "start": "2025-05-01",
        "end": "2025-05-31",
        "amount": 25.36
      },
      {
        "num": "4000350996",
        "start": "2025-06-01",
        "end": "2025-06-30",
        "amount": 667.86
      },
      {
        "num": "4000353294",
        "start": "2025-07-01",
        "end": "2025-07-31",
        "amount": 7440.45
      },
      {
        "num": "4000355436",
        "start": "2025-08-01",
        "end": "2025-08-31",
        "amount": 1198.7
      },
      {
        "num": "4000357292",
        "start": "2025-09-01",
        "end": "2025-09-30",
        "amount": 691.6
      },
      {
        "num": "4000359196",
        "start": "2025-10-01",
        "end": "2025-10-31",
        "amount": 523.46
      },
      {
        "num": "4000361029",
        "start": "2025-11-01",
        "end": "2025-11-30",
        "amount": 9473.74
      },
      {
        "num": "IAU2600210",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 11940.95
      },
      {
        "num": "IAU2600640",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 18061.58
      },
      {
        "num": "IAU2601086",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 7446.49
      },
      {
        "num": "IAU2601562",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 30884.79
      },
      {
        "num": "IAU2601563",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 1.36
      },
      {
        "num": "IAU2602011",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 34075.12
      },
      {
        "num": "IAU2602012",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 626.17
      },
      {
        "num": "IAU2602589",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 48241.64
      },
      {
        "num": "IAU2602479",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 113.56
      },
      {
        "num": "IAU2602921",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 103.89
      },
      {
        "num": "IAU2603015",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 92524.86
      },
      {
        "num": "IAU2603378",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 1.06
      },
      {
        "num": "IAU2603377",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 90502.61
      }
    ],
    "receipts": [
      {
        "date": "2025-10-24",
        "invoices": "",
        "amount": 8261.22
      },
      {
        "date": "2025-12-05",
        "invoices": "",
        "amount": 31578.76
      },
      {
        "date": "2026-01-23",
        "invoices": "",
        "amount": 15976.89
      },
      {
        "date": "2026-03-10",
        "invoices": "",
        "amount": 17428.24
      },
      {
        "date": "2026-05-08",
        "invoices": "",
        "amount": 16066.76
      },
      {
        "date": "2026-06-22",
        "invoices": "",
        "amount": 15707.32
      }
    ],
    "payments": [],
    "adjustments": [
      {
        "type": "DEBIT_NOTE",
        "date": "2026-06-30",
        "amount": 146.15,
        "ref": "143217"
      }
    ]
  },
  {
    "key": "my-country-mobile",
    "name": "MY COUNTRY MOBILE",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000080",
    "accountId": "50a0a000-0000-4000-8000-000000000080",
    "sales": [
      {
        "num": "2019-02-10",
        "start": "2019-02-04",
        "end": "2019-02-10",
        "amount": 0.04
      },
      {
        "num": "107089",
        "start": "2019-03-04",
        "end": "2019-03-10",
        "amount": 233.01
      },
      {
        "num": "107186",
        "start": "2019-03-11",
        "end": "2019-03-17",
        "amount": 71.82
      },
      {
        "num": "107234",
        "start": "2019-03-18",
        "end": "2019-03-24",
        "amount": 52.97
      },
      {
        "num": "107285",
        "start": "2019-03-25",
        "end": "2019-03-31",
        "amount": 1073.76
      },
      {
        "num": "107392",
        "start": "2019-04-01",
        "end": "2019-04-07",
        "amount": 3881.37
      },
      {
        "num": "107443",
        "start": "2019-04-08",
        "end": "2019-04-14",
        "amount": 2727.63
      },
      {
        "num": "107539",
        "start": "2019-04-15",
        "end": "2019-04-21",
        "amount": 1929.57
      },
      {
        "num": "107593",
        "start": "2019-04-22",
        "end": "2019-04-28",
        "amount": 1910.84
      },
      {
        "num": "107704",
        "start": "2019-04-29",
        "end": "2019-05-05",
        "amount": 2215.83
      },
      {
        "num": "107754",
        "start": "2019-05-06",
        "end": "2019-05-12",
        "amount": 1742.79
      },
      {
        "num": "107850",
        "start": "2019-05-13",
        "end": "2019-05-19",
        "amount": 3314.78
      },
      {
        "num": "107902",
        "start": "2019-05-20",
        "end": "2019-05-26",
        "amount": 1615.48
      },
      {
        "num": "108021",
        "start": "2019-05-27",
        "end": "2019-06-02",
        "amount": 135.18
      },
      {
        "num": "108083",
        "start": "2019-06-03",
        "end": "2019-06-09",
        "amount": 35.89
      },
      {
        "num": "108175",
        "start": "2019-06-10",
        "end": "2019-06-16",
        "amount": 19.68
      },
      {
        "num": "108220",
        "start": "2019-06-17",
        "end": "2019-06-23",
        "amount": 8.24
      },
      {
        "num": "108272",
        "start": "2019-06-24",
        "end": "2019-06-30",
        "amount": 1054.02
      },
      {
        "num": "108363",
        "start": "2019-07-01",
        "end": "2019-07-07",
        "amount": 1205.99
      },
      {
        "num": "108406",
        "start": "2019-07-08",
        "end": "2019-07-14",
        "amount": 517.71
      },
      {
        "num": "108500",
        "start": "2019-07-15",
        "end": "2019-07-21",
        "amount": 1346.65
      },
      {
        "num": "108545",
        "start": "2019-07-22",
        "end": "2019-07-28",
        "amount": 1774.94
      },
      {
        "num": "108654",
        "start": "2019-07-29",
        "end": "2019-08-04",
        "amount": 2252.83
      },
      {
        "num": "108704",
        "start": "2019-08-05",
        "end": "2019-08-11",
        "amount": 781.2
      },
      {
        "num": "108797",
        "start": "2019-08-12",
        "end": "2019-08-18",
        "amount": 237.29
      },
      {
        "num": "108846",
        "start": "2019-08-19",
        "end": "2019-08-25",
        "amount": 183.32
      },
      {
        "num": "108957",
        "start": "2019-08-26",
        "end": "2019-09-01",
        "amount": 579.34
      },
      {
        "num": "109018",
        "start": "2019-09-02",
        "end": "2019-09-08",
        "amount": 92.8
      },
      {
        "num": "109085",
        "start": "2019-09-09",
        "end": "2019-09-15",
        "amount": 256.03
      },
      {
        "num": "109179",
        "start": "2019-09-16",
        "end": "2019-09-22",
        "amount": 628.03
      },
      {
        "num": "109229",
        "start": "2019-09-23",
        "end": "2019-09-29",
        "amount": 200.72
      },
      {
        "num": "109338",
        "start": "2019-09-30",
        "end": "2019-10-06",
        "amount": 92.64
      },
      {
        "num": "109381",
        "start": "2019-10-07",
        "end": "2019-10-13",
        "amount": 34.74
      },
      {
        "num": "109475",
        "start": "2019-10-14",
        "end": "2019-10-20",
        "amount": 9329.19
      },
      {
        "num": "109517",
        "start": "2019-10-21",
        "end": "2019-10-27",
        "amount": 93.78
      },
      {
        "num": "109634",
        "start": "2019-10-28",
        "end": "2019-11-03",
        "amount": 100.79
      },
      {
        "num": "109677",
        "start": "2019-11-04",
        "end": "2019-11-10",
        "amount": 64.09
      },
      {
        "num": "109773",
        "start": "2019-11-11",
        "end": "2019-11-17",
        "amount": 87.37
      },
      {
        "num": "109824",
        "start": "2019-11-18",
        "end": "2019-11-24",
        "amount": 146.04
      },
      {
        "num": "109949",
        "start": "2019-11-25",
        "end": "2019-12-01",
        "amount": 334.37
      },
      {
        "num": "110003",
        "start": "2019-12-02",
        "end": "2019-12-08",
        "amount": 238.45
      },
      {
        "num": "110065",
        "start": "2019-12-09",
        "end": "2019-12-15",
        "amount": 32.77
      },
      {
        "num": "110159",
        "start": "2019-12-16",
        "end": "2019-12-22",
        "amount": 170.76
      },
      {
        "num": "110212",
        "start": "2019-12-23",
        "end": "2019-12-29",
        "amount": 22.06
      },
      {
        "num": "110329",
        "start": "2019-12-30",
        "end": "2020-01-05",
        "amount": 31.22
      },
      {
        "num": "110379",
        "start": "2020-01-06",
        "end": "2020-01-12",
        "amount": 65.46
      },
      {
        "num": "110482",
        "start": "2020-01-13",
        "end": "2020-01-19",
        "amount": 1071.74
      },
      {
        "num": "110533",
        "start": "2020-01-20",
        "end": "2020-01-26",
        "amount": 167.56
      },
      {
        "num": "110682",
        "start": "2020-01-27",
        "end": "2020-02-02",
        "amount": 167.72
      },
      {
        "num": "110751",
        "start": "2020-02-03",
        "end": "2020-02-09",
        "amount": 196.57
      },
      {
        "num": "110878",
        "start": "2020-02-10",
        "end": "2020-02-16",
        "amount": 160.71
      },
      {
        "num": "110937",
        "start": "2020-02-17",
        "end": "2020-02-23",
        "amount": 8.18
      },
      {
        "num": "111099",
        "start": "2020-02-24",
        "end": "2020-03-01",
        "amount": 80.22
      },
      {
        "num": "111169",
        "start": "2020-03-02",
        "end": "2020-03-08",
        "amount": 1604.35
      },
      {
        "num": "111258",
        "start": "2020-03-09",
        "end": "2020-03-15",
        "amount": 330.89
      },
      {
        "num": "111375",
        "start": "2020-03-16",
        "end": "2020-03-22",
        "amount": 434.5
      },
      {
        "num": "111436",
        "start": "2020-03-23",
        "end": "2020-03-29",
        "amount": 68.58
      },
      {
        "num": "111605",
        "start": "2020-03-30",
        "end": "2020-04-05",
        "amount": 28.87
      },
      {
        "num": "111657",
        "start": "2020-04-06",
        "end": "2020-04-12",
        "amount": 109.72
      },
      {
        "num": "111781",
        "start": "2020-04-13",
        "end": "2020-04-19",
        "amount": 34.05
      },
      {
        "num": "111820",
        "start": "2020-04-20",
        "end": "2020-04-26",
        "amount": 3.04
      },
      {
        "num": "111974",
        "start": "2020-04-27",
        "end": "2020-05-03",
        "amount": 259.12
      },
      {
        "num": "112007",
        "start": "2020-05-04",
        "end": "2020-05-10",
        "amount": 270.5
      },
      {
        "num": "112127",
        "start": "2020-05-11",
        "end": "2020-05-17",
        "amount": 380.42
      },
      {
        "num": "112208",
        "start": "2020-05-18",
        "end": "2020-05-24",
        "amount": 11.27
      },
      {
        "num": "112245",
        "start": "2020-05-25",
        "end": "2020-05-31",
        "amount": 8.55
      },
      {
        "num": "112375",
        "start": "2020-06-01",
        "end": "2020-06-07",
        "amount": 16.73
      },
      {
        "num": "112408",
        "start": "2020-06-08",
        "end": "2020-06-14",
        "amount": 5.36
      },
      {
        "num": "112527",
        "start": "2020-06-15",
        "end": "2020-06-21",
        "amount": 8.39
      },
      {
        "num": "112560",
        "start": "2020-06-22",
        "end": "2020-06-28",
        "amount": 432.68
      },
      {
        "num": "112719",
        "start": "2020-06-29",
        "end": "2020-07-05",
        "amount": 176.41
      },
      {
        "num": "112750",
        "start": "2020-07-06",
        "end": "2020-07-12",
        "amount": 136.65
      },
      {
        "num": "112878",
        "start": "2020-07-13",
        "end": "2020-07-19",
        "amount": 119.48
      },
      {
        "num": "112909",
        "start": "2020-07-20",
        "end": "2020-07-26",
        "amount": 109.5
      },
      {
        "num": "113069",
        "start": "2020-07-27",
        "end": "2020-08-02",
        "amount": 76.69
      },
      {
        "num": "113099",
        "start": "2020-08-03",
        "end": "2020-08-09",
        "amount": 35.17
      },
      {
        "num": "113220",
        "start": "2020-08-10",
        "end": "2020-08-16",
        "amount": 27.11
      },
      {
        "num": "113250",
        "start": "2020-08-17",
        "end": "2020-08-23",
        "amount": 16.91
      },
      {
        "num": "113284",
        "start": "2020-08-24",
        "end": "2020-08-30",
        "amount": 0.47
      },
      {
        "num": "113450",
        "start": "2020-08-31",
        "end": "2020-09-06",
        "amount": 2196.21
      },
      {
        "num": "113482",
        "start": "2020-09-07",
        "end": "2020-09-13",
        "amount": 0.43
      },
      {
        "num": "113609",
        "start": "2020-09-14",
        "end": "2020-09-20",
        "amount": 8.3
      },
      {
        "num": "113644",
        "start": "2020-09-21",
        "end": "2020-09-27",
        "amount": 0.08
      },
      {
        "num": "113811",
        "start": "2020-09-28",
        "end": "2020-10-04",
        "amount": 184.78
      },
      {
        "num": "113841",
        "start": "2020-10-05",
        "end": "2020-10-11",
        "amount": 50.81
      },
      {
        "num": "113972",
        "start": "2020-10-12",
        "end": "2020-10-18",
        "amount": 1.27
      },
      {
        "num": "114007",
        "start": "2020-10-19",
        "end": "2020-10-25",
        "amount": 2
      },
      {
        "num": "114167",
        "start": "2020-10-26",
        "end": "2020-11-01",
        "amount": 3.78
      },
      {
        "num": "114207",
        "start": "2020-11-02",
        "end": "2020-11-08",
        "amount": 0.66
      },
      {
        "num": "114258",
        "start": "2020-11-09",
        "end": "2020-11-15",
        "amount": 11.77
      },
      {
        "num": "114401",
        "start": "2020-11-16",
        "end": "2020-11-22",
        "amount": 24.75
      },
      {
        "num": "114433",
        "start": "2020-11-23",
        "end": "2020-11-29",
        "amount": 15.48
      },
      {
        "num": "114597",
        "start": "2020-11-30",
        "end": "2020-12-06",
        "amount": 2.87
      },
      {
        "num": "114631",
        "start": "2020-12-07",
        "end": "2020-12-13",
        "amount": 1.06
      },
      {
        "num": "114761",
        "start": "2020-12-14",
        "end": "2020-12-20",
        "amount": 0.37
      },
      {
        "num": "114802",
        "start": "2020-12-21",
        "end": "2020-12-27",
        "amount": 0.14
      },
      {
        "num": "114969",
        "start": "2020-12-28",
        "end": "2021-01-03",
        "amount": 0.1
      },
      {
        "num": "115005",
        "start": "2021-01-04",
        "end": "2021-01-10",
        "amount": 0.15
      },
      {
        "num": "115143",
        "start": "2021-01-11",
        "end": "2021-01-17",
        "amount": 4.61
      },
      {
        "num": "115176",
        "start": "2021-01-18",
        "end": "2021-01-24",
        "amount": 0.33
      },
      {
        "num": "115256",
        "start": "2021-01-25",
        "end": "2021-01-31",
        "amount": 0.99
      },
      {
        "num": "115381",
        "start": "2021-02-01",
        "end": "2021-02-07",
        "amount": 39.04
      },
      {
        "num": "115415",
        "start": "2021-02-08",
        "end": "2021-02-14",
        "amount": 4.34
      },
      {
        "num": "115565",
        "start": "2021-02-15",
        "end": "2021-02-21",
        "amount": 47.52
      },
      {
        "num": "115648",
        "start": "2021-02-22",
        "end": "2021-02-28",
        "amount": 52.94
      },
      {
        "num": "115763",
        "start": "2021-03-01",
        "end": "2021-03-07",
        "amount": 31.1
      },
      {
        "num": "115799",
        "start": "2021-03-03",
        "end": "2021-03-14",
        "amount": 38.6
      },
      {
        "num": "115932",
        "start": "2021-03-15",
        "end": "2021-03-21",
        "amount": 5.92
      },
      {
        "num": "115965",
        "start": "2021-03-22",
        "end": "2021-03-28",
        "amount": 231.99
      },
      {
        "num": "116129",
        "start": "2021-03-29",
        "end": "2021-04-04",
        "amount": 529.29
      },
      {
        "num": "116166",
        "start": "2021-04-05",
        "end": "2021-04-11",
        "amount": 272.11
      },
      {
        "num": "116296",
        "start": "2021-04-12",
        "end": "2021-04-18",
        "amount": 78.53
      },
      {
        "num": "116325",
        "start": "2021-04-19",
        "end": "2021-04-25",
        "amount": 150
      },
      {
        "num": "116483",
        "start": "2021-04-26",
        "end": "2021-05-02",
        "amount": 131.11
      },
      {
        "num": "116519",
        "start": "2021-05-03",
        "end": "2021-05-09",
        "amount": 13.05
      },
      {
        "num": "116654",
        "start": "2021-05-10",
        "end": "2021-05-16",
        "amount": 118.27
      },
      {
        "num": "116684",
        "start": "2021-05-17",
        "end": "2021-05-23",
        "amount": 83.94
      },
      {
        "num": "116716",
        "start": "2021-05-24",
        "end": "2021-05-30",
        "amount": 30.59
      },
      {
        "num": "116864",
        "start": "2021-05-31",
        "end": "2021-06-06",
        "amount": 2.78
      },
      {
        "num": "116906",
        "start": "2021-06-07",
        "end": "2021-06-13",
        "amount": 8.59
      },
      {
        "num": "117031",
        "start": "2021-06-14",
        "end": "2021-06-20",
        "amount": 82.93
      },
      {
        "num": "117058",
        "start": "2021-06-21",
        "end": "2021-06-27",
        "amount": 56.45
      },
      {
        "num": "117251",
        "start": "2021-06-28",
        "end": "2021-07-04",
        "amount": 12.23
      },
      {
        "num": "117288",
        "start": "2021-07-05",
        "end": "2021-07-11",
        "amount": 1.87
      },
      {
        "num": "117426",
        "start": "2021-07-12",
        "end": "2021-07-18",
        "amount": 28.96
      },
      {
        "num": "117458",
        "start": "2021-07-19",
        "end": "2021-07-25",
        "amount": 82.07
      },
      {
        "num": "117628",
        "start": "2021-07-26",
        "end": "2021-08-01",
        "amount": 132.5
      },
      {
        "num": "117664",
        "start": "2021-08-02",
        "end": "2021-08-08",
        "amount": 358.54
      },
      {
        "num": "117759",
        "start": "2021-08-09",
        "end": "2021-08-15",
        "amount": 130.68
      },
      {
        "num": "117837",
        "start": "2021-08-16",
        "end": "2021-08-22",
        "amount": 9.05
      },
      {
        "num": "117874",
        "start": "2021-08-23",
        "end": "2021-08-29",
        "amount": 1234.39
      },
      {
        "num": "118043",
        "start": "2021-08-30",
        "end": "2021-09-05",
        "amount": 1383.75
      },
      {
        "num": "118079",
        "start": "2021-09-06",
        "end": "2021-09-12",
        "amount": 782.24
      },
      {
        "num": "118214",
        "start": "2021-09-13",
        "end": "2021-09-19",
        "amount": 72.8
      },
      {
        "num": "118566",
        "start": "2021-10-11",
        "end": "2021-10-17",
        "amount": 125.44
      },
      {
        "num": "118597",
        "start": "2021-10-18",
        "end": "2021-10-24",
        "amount": 78.62
      },
      {
        "num": "118715",
        "start": "2021-10-25",
        "end": "2021-10-31",
        "amount": 262.81
      },
      {
        "num": "118790",
        "start": "2021-11-01",
        "end": "2021-11-07",
        "amount": 1207.14
      },
      {
        "num": "118825",
        "start": "2021-11-08",
        "end": "2021-11-14",
        "amount": 1310.41
      },
      {
        "num": "118952",
        "start": "2021-11-15",
        "end": "2021-11-21",
        "amount": 621.2
      },
      {
        "num": "118981",
        "start": "2021-11-22",
        "end": "2021-11-28",
        "amount": 220.19
      },
      {
        "num": "119144",
        "start": "2021-11-29",
        "end": "2021-12-05",
        "amount": 49.89
      },
      {
        "num": "119173",
        "start": "2021-12-06",
        "end": "2021-12-12",
        "amount": 31.28
      },
      {
        "num": "119301",
        "start": "2021-12-13",
        "end": "2021-12-19",
        "amount": 240.78
      },
      {
        "num": "119330",
        "start": "2021-12-20",
        "end": "2021-12-26",
        "amount": 101.76
      },
      {
        "num": "119439",
        "start": "2021-12-27",
        "end": "2021-12-31",
        "amount": 33.84
      },
      {
        "num": "119512",
        "start": "2022-01-01",
        "end": "2022-01-02",
        "amount": 6.33
      },
      {
        "num": "119544",
        "start": "2022-01-03",
        "end": "2022-01-09",
        "amount": 24.95
      },
      {
        "num": "119666",
        "start": "2022-01-10",
        "end": "2022-01-16",
        "amount": 55.67
      },
      {
        "num": "119700",
        "start": "2022-01-17",
        "end": "2022-01-23",
        "amount": 23.91
      },
      {
        "num": "119708",
        "start": "2022-01-24",
        "end": "2022-01-30",
        "amount": 838.29
      },
      {
        "num": "119860",
        "start": "2022-01-31",
        "end": "2022-02-06",
        "amount": 49.23
      },
      {
        "num": "119890",
        "start": "2022-02-07",
        "end": "2022-02-13",
        "amount": 63.86
      },
      {
        "num": "120039",
        "start": "2022-02-14",
        "end": "2022-02-20",
        "amount": 95.48
      },
      {
        "num": "120074",
        "start": "2022-02-21",
        "end": "2022-02-27",
        "amount": 7.92
      },
      {
        "num": "120230",
        "start": "2022-02-28",
        "end": "2022-03-06",
        "amount": 3.26
      },
      {
        "num": "120261",
        "start": "2022-03-07",
        "end": "2022-03-13",
        "amount": 14.19
      },
      {
        "num": "120388",
        "start": "2022-03-14",
        "end": "2022-03-20",
        "amount": 17.68
      },
      {
        "num": "120421",
        "start": "2022-03-21",
        "end": "2022-03-27",
        "amount": 26.01
      },
      {
        "num": "120586",
        "start": "2022-03-28",
        "end": "2022-04-03",
        "amount": 5.4
      },
      {
        "num": "120619",
        "start": "2022-04-04",
        "end": "2022-04-10",
        "amount": 0.74
      },
      {
        "num": "120746",
        "start": "2022-04-11",
        "end": "2022-04-17",
        "amount": 109.11
      },
      {
        "num": "120779",
        "start": "2022-04-18",
        "end": "2022-04-24",
        "amount": 536
      },
      {
        "num": "120936",
        "start": "2022-04-25",
        "end": "2022-05-01",
        "amount": 1188.66
      },
      {
        "num": "120966",
        "start": "2022-05-02",
        "end": "2022-05-08",
        "amount": 1370.26
      },
      {
        "num": "121066",
        "start": "2022-05-09",
        "end": "2022-05-15",
        "amount": 1641.05
      },
      {
        "num": "121120",
        "start": "2022-05-16",
        "end": "2022-05-22",
        "amount": 2385.52
      },
      {
        "num": "121149",
        "start": "2022-05-23",
        "end": "2022-05-29",
        "amount": 2111.86
      },
      {
        "num": "121308",
        "start": "2022-05-30",
        "end": "2022-06-05",
        "amount": 1327.1
      },
      {
        "num": "121341",
        "start": "2022-06-06",
        "end": "2022-06-12",
        "amount": 703.77
      },
      {
        "num": "121478",
        "start": "2022-06-13",
        "end": "2022-06-19",
        "amount": 394.93
      },
      {
        "num": "121499",
        "start": "2022-06-20",
        "end": "2022-06-26",
        "amount": 473.57
      },
      {
        "num": "121680",
        "start": "2022-06-27",
        "end": "2022-07-03",
        "amount": 333.3
      },
      {
        "num": "121708",
        "start": "2022-07-04",
        "end": "2022-07-10",
        "amount": 888.84
      },
      {
        "num": "122103",
        "start": "2022-08-08",
        "end": "2022-08-14",
        "amount": 6.15
      },
      {
        "num": "122239",
        "start": "2022-08-15",
        "end": "2022-08-21",
        "amount": 89.39
      },
      {
        "num": "122275",
        "start": "2022-08-22",
        "end": "2022-08-28",
        "amount": 63.78
      },
      {
        "num": "122451",
        "start": "2022-08-29",
        "end": "2022-09-04",
        "amount": 36.63
      },
      {
        "num": "122495",
        "start": "2022-09-05",
        "end": "2022-09-11",
        "amount": 86.21
      },
      {
        "num": "122881",
        "start": "2022-09-26",
        "end": "2022-10-02",
        "amount": 0.05
      },
      {
        "num": "123113",
        "start": "2022-10-24",
        "end": "2022-10-30",
        "amount": 0.03
      },
      {
        "num": "123291",
        "start": "2022-10-31",
        "end": "2022-11-06",
        "amount": 327.49
      },
      {
        "num": "123337",
        "start": "2022-11-07",
        "end": "2022-11-13",
        "amount": 136.86
      },
      {
        "num": "123502",
        "start": "2022-11-14",
        "end": "2022-11-20",
        "amount": 50.7
      },
      {
        "num": "123519",
        "start": "2022-11-21",
        "end": "2022-11-27",
        "amount": 43.64
      },
      {
        "num": "123704",
        "start": "2022-11-28",
        "end": "2022-12-04",
        "amount": 0.01
      },
      {
        "num": "124195",
        "start": "2023-01-02",
        "end": "2023-01-08",
        "amount": 0.03
      },
      {
        "num": "124434",
        "start": "2023-01-23",
        "end": "2023-01-29",
        "amount": 0.69
      },
      {
        "num": "124688",
        "start": "2023-01-30",
        "end": "2023-02-05",
        "amount": 64.63
      },
      {
        "num": "124726",
        "start": "2023-02-06",
        "end": "2023-02-12",
        "amount": 0.06
      },
      {
        "num": "124873",
        "start": "2023-02-13",
        "end": "2023-02-19",
        "amount": 0.1
      },
      {
        "num": "124911",
        "start": "2023-02-20",
        "end": "2023-02-26",
        "amount": 0.24
      },
      {
        "num": "125084",
        "start": "2023-02-27",
        "end": "2023-03-05",
        "amount": 0.14
      },
      {
        "num": "125095",
        "start": "2023-03-06",
        "end": "2023-03-12",
        "amount": 0.05
      },
      {
        "num": "125237",
        "start": "2023-03-13",
        "end": "2023-03-19",
        "amount": 0.25
      },
      {
        "num": "125285",
        "start": "2023-03-20",
        "end": "2023-03-26",
        "amount": 0.2
      },
      {
        "num": "125469",
        "start": "2023-03-27",
        "end": "2023-04-02",
        "amount": 0.49
      },
      {
        "num": "125513",
        "start": "2023-04-03",
        "end": "2023-04-09",
        "amount": 1.68
      },
      {
        "num": "125660",
        "start": "2023-04-10",
        "end": "2023-04-16",
        "amount": 1.12
      },
      {
        "num": "125701",
        "start": "2023-04-17",
        "end": "2023-04-23",
        "amount": 6.5
      },
      {
        "num": "125796",
        "start": "2023-04-24",
        "end": "2023-04-30",
        "amount": 1.51
      },
      {
        "num": "125924",
        "start": "2023-05-01",
        "end": "2023-05-07",
        "amount": 0.53
      },
      {
        "num": "125965",
        "start": "2023-05-08",
        "end": "2023-05-14",
        "amount": 124.87
      },
      {
        "num": "126116",
        "start": "2023-05-15",
        "end": "2023-05-21",
        "amount": 204.22
      },
      {
        "num": "126155",
        "start": "2023-05-22",
        "end": "2023-05-28",
        "amount": 148.89
      },
      {
        "num": "126350",
        "start": "2023-05-29",
        "end": "2023-06-04",
        "amount": 178.75
      },
      {
        "num": "126392",
        "start": "2023-06-05",
        "end": "2023-06-11",
        "amount": 234.92
      },
      {
        "num": "126551",
        "start": "2023-06-12",
        "end": "2023-06-18",
        "amount": 59.71
      },
      {
        "num": "126590",
        "start": "2023-06-19",
        "end": "2023-06-25",
        "amount": 25.5
      },
      {
        "num": "126786",
        "start": "2023-06-26",
        "end": "2023-07-02",
        "amount": 94.53
      },
      {
        "num": "126833",
        "start": "2023-07-03",
        "end": "2023-07-09",
        "amount": 29.22
      },
      {
        "num": "126993",
        "start": "2023-07-10",
        "end": "2023-07-16",
        "amount": 1.38
      },
      {
        "num": "127050",
        "start": "2023-07-17",
        "end": "2023-07-23",
        "amount": 22.38
      },
      {
        "num": "127091",
        "start": "2023-07-24",
        "end": "2023-07-30",
        "amount": 20.95
      },
      {
        "num": "127310",
        "start": "2023-07-31",
        "end": "2023-08-06",
        "amount": 41.76
      },
      {
        "num": "127355",
        "start": "2023-08-07",
        "end": "2023-08-13",
        "amount": 302.32
      },
      {
        "num": "127512",
        "start": "2023-08-14",
        "end": "2023-08-20",
        "amount": 227.63
      },
      {
        "num": "127549",
        "start": "2023-08-21",
        "end": "2023-08-27",
        "amount": 306.07
      },
      {
        "num": "127780",
        "start": "2023-08-28",
        "end": "2023-09-03",
        "amount": 209.05
      },
      {
        "num": "127825",
        "start": "2023-09-04",
        "end": "2023-09-10",
        "amount": 1285.75
      },
      {
        "num": "127982",
        "start": "2023-09-11",
        "end": "2023-09-17",
        "amount": 141.18
      },
      {
        "num": "128029",
        "start": "2023-09-18",
        "end": "2023-09-24",
        "amount": 33.27
      },
      {
        "num": "128241",
        "start": "2023-09-25",
        "end": "2023-10-01",
        "amount": 172.16
      },
      {
        "num": "128285",
        "start": "2023-10-02",
        "end": "2023-10-08",
        "amount": 20.81
      },
      {
        "num": "128429",
        "start": "2023-10-09",
        "end": "2023-10-15",
        "amount": 7.5
      },
      {
        "num": "128482",
        "start": "2023-10-16",
        "end": "2023-10-22",
        "amount": 0.92
      },
      {
        "num": "128525",
        "start": "2023-10-23",
        "end": "2023-10-29",
        "amount": 5.64
      },
      {
        "num": "128731",
        "start": "2023-10-30",
        "end": "2023-11-05",
        "amount": 0.58
      },
      {
        "num": "128770",
        "start": "2023-11-06",
        "end": "2023-11-12",
        "amount": 3.48
      },
      {
        "num": "128917",
        "start": "2023-11-13",
        "end": "2023-11-19",
        "amount": 2.25
      },
      {
        "num": "128960",
        "start": "2023-11-20",
        "end": "2023-11-26",
        "amount": 0.28
      },
      {
        "num": "129166",
        "start": "2023-11-27",
        "end": "2023-12-03",
        "amount": 0.18
      },
      {
        "num": "129206",
        "start": "2023-12-04",
        "end": "2023-12-10",
        "amount": 1.34
      },
      {
        "num": "129364",
        "start": "2023-12-11",
        "end": "2023-12-17",
        "amount": 0.01
      },
      {
        "num": "129414",
        "start": "2023-12-18",
        "end": "2023-12-24",
        "amount": 0.3
      },
      {
        "num": "129612",
        "start": "2023-12-25",
        "end": "2023-12-31",
        "amount": 0.01
      },
      {
        "num": "129641",
        "start": "2024-01-01",
        "end": "2024-01-07",
        "amount": 7.23
      },
      {
        "num": "129679",
        "start": "2024-01-08",
        "end": "2024-01-14",
        "amount": 2.08
      },
      {
        "num": "129863",
        "start": "2024-01-15",
        "end": "2024-01-21",
        "amount": 35.06
      },
      {
        "num": "129929",
        "start": "2024-01-22",
        "end": "2024-01-28",
        "amount": 6.16
      },
      {
        "num": "130140",
        "start": "2024-01-29",
        "end": "2024-02-04",
        "amount": 3.47
      },
      {
        "num": "130186",
        "start": "2024-02-05",
        "end": "2024-02-11",
        "amount": 0.38
      },
      {
        "num": "130342",
        "start": "2024-02-12",
        "end": "2024-02-18",
        "amount": 0.7
      },
      {
        "num": "130383",
        "start": "2024-02-19",
        "end": "2024-02-25",
        "amount": 0.99
      },
      {
        "num": "130557",
        "start": "2024-02-26",
        "end": "2024-03-03",
        "amount": 3.24
      },
      {
        "num": "130610",
        "start": "2024-03-04",
        "end": "2024-03-10",
        "amount": 4.72
      },
      {
        "num": "130762",
        "start": "2024-03-11",
        "end": "2024-03-17",
        "amount": 44.99
      },
      {
        "num": "130800",
        "start": "2024-03-18",
        "end": "2024-03-24",
        "amount": 25.63
      },
      {
        "num": "130891",
        "start": "2024-03-25",
        "end": "2024-03-31",
        "amount": 99.44
      },
      {
        "num": "131056",
        "start": "2024-04-01",
        "end": "2024-04-07",
        "amount": 4.48
      },
      {
        "num": "131088",
        "start": "2024-04-08",
        "end": "2024-04-14",
        "amount": 9.59
      },
      {
        "num": "131265",
        "start": "2024-04-15",
        "end": "2024-04-21",
        "amount": 15.79
      },
      {
        "num": "131306",
        "start": "2024-04-22",
        "end": "2024-04-28",
        "amount": 1.25
      },
      {
        "num": "131523",
        "start": "2024-04-29",
        "end": "2024-05-05",
        "amount": 14.3
      },
      {
        "num": "131561",
        "start": "2024-05-06",
        "end": "2024-05-12",
        "amount": 3.39
      },
      {
        "num": "131703",
        "start": "2024-05-13",
        "end": "2024-05-19",
        "amount": 4.87
      },
      {
        "num": "131741",
        "start": "2024-05-20",
        "end": "2024-05-26",
        "amount": 1.73
      },
      {
        "num": "131947",
        "start": "2024-05-27",
        "end": "2024-06-02",
        "amount": 2.58
      },
      {
        "num": "131983",
        "start": "2024-06-03",
        "end": "2024-06-09",
        "amount": 4.24
      },
      {
        "num": "132125",
        "start": "2024-06-10",
        "end": "2024-06-16",
        "amount": 7.36
      },
      {
        "num": "132163",
        "start": "2024-06-17",
        "end": "2024-06-23",
        "amount": 11.76
      },
      {
        "num": "132267",
        "start": "2024-06-24",
        "end": "2024-06-30",
        "amount": 2.01
      },
      {
        "num": "132406",
        "start": "2024-07-01",
        "end": "2024-07-07",
        "amount": 5.69
      },
      {
        "num": "132442",
        "start": "2024-07-08",
        "end": "2024-07-14",
        "amount": 2.37
      },
      {
        "num": "132598",
        "start": "2024-07-15",
        "end": "2024-07-21",
        "amount": 4.66
      },
      {
        "num": "132640",
        "start": "2024-07-22",
        "end": "2024-07-28",
        "amount": 173.89
      },
      {
        "num": "132857",
        "start": "2024-07-29",
        "end": "2024-08-04",
        "amount": 53.57
      },
      {
        "num": "132896",
        "start": "2024-08-05",
        "end": "2024-08-11",
        "amount": 57.59
      },
      {
        "num": "133063",
        "start": "2024-08-12",
        "end": "2024-08-18",
        "amount": 102.44
      },
      {
        "num": "133099",
        "start": "2024-08-19",
        "end": "2024-08-25",
        "amount": 280.19
      },
      {
        "num": "133317",
        "start": "2024-08-26",
        "end": "2024-09-01",
        "amount": 233.48
      },
      {
        "num": "133366",
        "start": "2024-09-02",
        "end": "2024-09-08",
        "amount": 166.18
      },
      {
        "num": "133522",
        "start": "2024-09-09",
        "end": "2024-09-15",
        "amount": 63.02
      },
      {
        "num": "133563",
        "start": "2024-09-16",
        "end": "2024-09-22",
        "amount": 48.22
      },
      {
        "num": "133612",
        "start": "2024-09-23",
        "end": "2024-09-29",
        "amount": 2.75
      },
      {
        "num": "133828",
        "start": "2024-09-30",
        "end": "2024-10-06",
        "amount": 89.17
      },
      {
        "num": "133838",
        "start": "2024-10-07",
        "end": "2024-10-13",
        "amount": 5.31
      },
      {
        "num": "134034",
        "start": "2024-10-14",
        "end": "2024-10-20",
        "amount": 13.38
      },
      {
        "num": "134044",
        "start": "2024-10-21",
        "end": "2024-10-27",
        "amount": 14.83
      },
      {
        "num": "134269",
        "start": "2024-10-28",
        "end": "2024-11-03",
        "amount": 6.24
      },
      {
        "num": "134302",
        "start": "2024-11-04",
        "end": "2024-11-10",
        "amount": 5
      },
      {
        "num": "134459",
        "start": "2024-11-11",
        "end": "2024-11-17",
        "amount": 5.77
      },
      {
        "num": "134501",
        "start": "2024-11-18",
        "end": "2024-11-24",
        "amount": 13.84
      },
      {
        "num": "134713",
        "start": "2024-11-25",
        "end": "2024-12-01",
        "amount": 1.15
      },
      {
        "num": "134763",
        "start": "2024-12-02",
        "end": "2024-12-08",
        "amount": 65.55
      },
      {
        "num": "134841",
        "start": "2024-12-09",
        "end": "2024-12-15",
        "amount": 68.17
      },
      {
        "num": "134952",
        "start": "2024-12-16",
        "end": "2024-12-22",
        "amount": 1.91
      },
      {
        "num": "134982",
        "start": "2024-12-23",
        "end": "2024-12-29",
        "amount": 62.57
      },
      {
        "num": "135093",
        "start": "2024-12-30",
        "end": "2024-12-31",
        "amount": 14.3
      },
      {
        "num": "135220",
        "start": "2025-01-01",
        "end": "2025-01-05",
        "amount": 4.96
      },
      {
        "num": "135254",
        "start": "2025-01-06",
        "end": "2025-01-12",
        "amount": 2.22
      },
      {
        "num": "135411",
        "start": "2025-01-13",
        "end": "2025-01-19",
        "amount": 1.64
      },
      {
        "num": "135457",
        "start": "2025-01-20",
        "end": "2025-01-26",
        "amount": 0.02
      },
      {
        "num": "135696",
        "start": "2025-01-27",
        "end": "2025-02-02",
        "amount": 13.87
      },
      {
        "num": "135736",
        "start": "2025-02-03",
        "end": "2025-02-09",
        "amount": 19.87
      },
      {
        "num": "136148",
        "start": "2025-02-24",
        "end": "2025-03-02",
        "amount": 2.01
      },
      {
        "num": "136182",
        "start": "2025-03-03",
        "end": "2025-03-09",
        "amount": 20.75
      },
      {
        "num": "136333",
        "start": "2025-03-10",
        "end": "2025-03-16",
        "amount": 7.7
      },
      {
        "num": "136590",
        "start": "2025-03-31",
        "end": "2025-04-06",
        "amount": 0.11
      },
      {
        "num": "136623",
        "start": "2025-04-07",
        "end": "2025-04-13",
        "amount": 1.82
      },
      {
        "num": "136773",
        "start": "2025-04-14",
        "end": "2025-04-20",
        "amount": 0.93
      },
      {
        "num": "137033",
        "start": "2025-04-28",
        "end": "2025-05-04",
        "amount": 0.06
      },
      {
        "num": "137060",
        "start": "2025-05-05",
        "end": "2025-05-11",
        "amount": 0.35
      },
      {
        "num": "137212",
        "start": "2025-05-12",
        "end": "2025-05-18",
        "amount": 0.09
      },
      {
        "num": "137238",
        "start": "2025-05-19",
        "end": "2025-05-25",
        "amount": 0.49
      },
      {
        "num": "137466",
        "start": "2025-05-26",
        "end": "2025-06-01",
        "amount": 1.02
      },
      {
        "num": "137490",
        "start": "2025-06-02",
        "end": "2025-06-08",
        "amount": 1.89
      },
      {
        "num": "137558",
        "start": "2025-06-09",
        "end": "2025-06-15",
        "amount": 2.11
      },
      {
        "num": "137670",
        "start": "2025-06-16",
        "end": "2025-06-22",
        "amount": 1.23
      },
      {
        "num": "137710",
        "start": "2025-06-23",
        "end": "2025-06-29",
        "amount": 17.19
      },
      {
        "num": "137929",
        "start": "2025-06-30",
        "end": "2025-07-06",
        "amount": 5.53
      },
      {
        "num": "137964",
        "start": "2025-07-07",
        "end": "2025-07-13",
        "amount": 3.91
      },
      {
        "num": "138106",
        "start": "2025-07-14",
        "end": "2025-07-20",
        "amount": 0.11
      },
      {
        "num": "138148",
        "start": "2025-07-21",
        "end": "2025-07-27",
        "amount": 0.07
      },
      {
        "num": "138366",
        "start": "2025-07-28",
        "end": "2025-08-03",
        "amount": 0.23
      },
      {
        "num": "138393",
        "start": "2025-08-04",
        "end": "2025-08-10",
        "amount": 0.04
      },
      {
        "num": "138549",
        "start": "2025-08-11",
        "end": "2025-08-17",
        "amount": 0.15
      },
      {
        "num": "138592",
        "start": "2025-08-18",
        "end": "2025-08-24",
        "amount": 1.15
      },
      {
        "num": "138704",
        "start": "2025-08-25",
        "end": "2025-08-31",
        "amount": 0.89
      },
      {
        "num": "138842",
        "start": "2025-09-01",
        "end": "2025-09-07",
        "amount": 2.38
      },
      {
        "num": "138876",
        "start": "2025-09-08",
        "end": "2025-09-14",
        "amount": 15.29
      },
      {
        "num": "139019",
        "start": "2025-09-15",
        "end": "2025-09-21",
        "amount": 1.12
      },
      {
        "num": "139072",
        "start": "2025-09-22",
        "end": "2025-09-28",
        "amount": 0.65
      },
      {
        "num": "139295",
        "start": "2025-09-29",
        "end": "2025-10-05",
        "amount": 1.14
      },
      {
        "num": "139328",
        "start": "2025-10-06",
        "end": "2025-10-12",
        "amount": 3.63
      },
      {
        "num": "139480",
        "start": "2025-10-13",
        "end": "2025-10-19",
        "amount": 3.15
      },
      {
        "num": "139512",
        "start": "2025-10-20",
        "end": "2025-10-26",
        "amount": 0.46
      },
      {
        "num": "139729",
        "start": "2025-10-27",
        "end": "2025-11-02",
        "amount": 0.88
      },
      {
        "num": "139741",
        "start": "2025-11-03",
        "end": "2025-11-09",
        "amount": 1.71
      },
      {
        "num": "139892",
        "start": "2025-11-10",
        "end": "2025-11-16",
        "amount": 3.36
      },
      {
        "num": "139926",
        "start": "2025-11-17",
        "end": "2025-11-23",
        "amount": 1.21
      },
      {
        "num": "139999",
        "start": "2025-11-24",
        "end": "2025-11-30",
        "amount": 4.84
      },
      {
        "num": "140173",
        "start": "2025-12-01",
        "end": "2025-12-07",
        "amount": 2.74
      },
      {
        "num": "140209",
        "start": "2025-12-08",
        "end": "2025-12-14",
        "amount": 0.68
      },
      {
        "num": "140355",
        "start": "2025-12-15",
        "end": "2025-12-21",
        "amount": 0.08
      },
      {
        "num": "140392",
        "start": "2025-12-22",
        "end": "2025-12-28",
        "amount": 0.12
      },
      {
        "num": "140606",
        "start": "2025-12-29",
        "end": "2025-12-31",
        "amount": 0.13
      },
      {
        "num": "140631",
        "start": "2026-01-01",
        "end": "2026-01-04",
        "amount": 0.34
      },
      {
        "num": "140663",
        "start": "2026-01-05",
        "end": "2026-01-11",
        "amount": 0.22
      },
      {
        "num": "140809",
        "start": "2026-01-12",
        "end": "2026-01-18",
        "amount": 0.03
      },
      {
        "num": "140847",
        "start": "2026-01-19",
        "end": "2026-01-25",
        "amount": 0.07
      },
      {
        "num": "141061",
        "start": "2026-01-26",
        "end": "2026-02-01",
        "amount": 0.14
      },
      {
        "num": "141093",
        "start": "2026-02-02",
        "end": "2026-02-08",
        "amount": 0.05
      },
      {
        "num": "141158",
        "start": "2026-02-09",
        "end": "2026-02-15",
        "amount": 0.1
      },
      {
        "num": "141283",
        "start": "2026-02-16",
        "end": "2026-02-22",
        "amount": 0.07
      },
      {
        "num": "141496",
        "start": "2026-02-23",
        "end": "2026-03-01",
        "amount": 0.02
      },
      {
        "num": "141527",
        "start": "2026-03-02",
        "end": "2026-03-08",
        "amount": 0.08
      },
      {
        "num": "141597",
        "start": "2026-03-09",
        "end": "2026-03-15",
        "amount": 0.24
      },
      {
        "num": "141741",
        "start": "2026-03-23",
        "end": "2026-03-29",
        "amount": 0.03
      },
      {
        "num": "141967",
        "start": "2026-03-30",
        "end": "2026-04-05",
        "amount": 0.42
      },
      {
        "num": "142018",
        "start": "2026-04-06",
        "end": "2026-04-12",
        "amount": 2.16
      },
      {
        "num": "142165",
        "start": "2026-04-13",
        "end": "2026-04-19",
        "amount": 2.93
      },
      {
        "num": "142199",
        "start": "2026-04-20",
        "end": "2026-04-26",
        "amount": 3.46
      },
      {
        "num": "142415",
        "start": "2026-04-27",
        "end": "2026-05-03",
        "amount": 0.89
      },
      {
        "num": "142789",
        "start": "2026-05-25",
        "end": "2026-05-31",
        "amount": 0.47
      },
      {
        "num": "142920",
        "start": "2026-06-01",
        "end": "2026-06-07",
        "amount": 2.13
      },
      {
        "num": "143070",
        "start": "2026-06-15",
        "end": "2026-06-21",
        "amount": 0.6
      },
      {
        "num": "143104",
        "start": "2026-06-22",
        "end": "2026-06-28",
        "amount": 0.71
      },
      {
        "num": "143330",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 0.34
      },
      {
        "num": "143363",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 0.4
      },
      {
        "num": "143505",
        "start": "2026-07-13",
        "end": "2026-07-19",
        "amount": 2.03
      },
      {
        "num": "143578",
        "start": "2026-07-20",
        "end": "2026-07-26",
        "amount": 1.38
      },
      {
        "num": "143799",
        "start": "2026-07-27",
        "end": "2026-08-02",
        "amount": 1.8
      },
      {
        "num": "143831",
        "start": "2026-08-03",
        "end": "2026-08-09",
        "amount": 0.74
      }
    ],
    "purchases": [
      {
        "num": "28799",
        "start": "2019-02-04",
        "end": "2019-02-10",
        "amount": 0.02
      },
      {
        "num": "29003",
        "start": "2019-02-18",
        "end": "2019-02-24",
        "amount": 6.91
      },
      {
        "num": "29159",
        "start": "2019-02-25",
        "end": "2019-03-03",
        "amount": 75.2
      },
      {
        "num": "29263",
        "start": "2019-03-04",
        "end": "2019-03-10",
        "amount": 102.4
      },
      {
        "num": "29398",
        "start": "2019-03-11",
        "end": "2019-03-17",
        "amount": 596.52
      },
      {
        "num": "29513",
        "start": "2019-03-18",
        "end": "2019-03-24",
        "amount": 38.38
      },
      {
        "num": "29620",
        "start": "2019-03-25",
        "end": "2019-03-31",
        "amount": 4922.79
      },
      {
        "num": "29786",
        "start": "2019-04-01",
        "end": "2019-04-07",
        "amount": 1610.16
      },
      {
        "num": "29871",
        "start": "2019-04-08",
        "end": "2019-04-14",
        "amount": 1395.47
      },
      {
        "num": "29989",
        "start": "2019-04-15",
        "end": "2019-04-21",
        "amount": 4639.44
      },
      {
        "num": "30078",
        "start": "2019-04-22",
        "end": "2019-04-28",
        "amount": 1179.43
      },
      {
        "num": "30251",
        "start": "2019-04-29",
        "end": "2019-05-05",
        "amount": 2237.07
      },
      {
        "num": "30346",
        "start": "2019-05-06",
        "end": "2019-05-12",
        "amount": 2526.95
      },
      {
        "num": "30471",
        "start": "2019-05-13",
        "end": "2019-05-19",
        "amount": 657.65
      },
      {
        "num": "30574",
        "start": "2019-05-20",
        "end": "2019-05-26",
        "amount": 620.22
      },
      {
        "num": "30753",
        "start": "2019-05-27",
        "end": "2019-06-02",
        "amount": 1205.91
      },
      {
        "num": "30834",
        "start": "2019-06-03",
        "end": "2019-06-09",
        "amount": 809.75
      },
      {
        "num": "30947",
        "start": "2019-06-10",
        "end": "2019-06-16",
        "amount": 54.78
      },
      {
        "num": "31029",
        "start": "2019-06-17",
        "end": "2019-06-23",
        "amount": 571.88
      },
      {
        "num": "31108",
        "start": "2019-06-24",
        "end": "2019-06-30",
        "amount": 583.44
      },
      {
        "num": "31261",
        "start": "2019-07-01",
        "end": "2019-07-07",
        "amount": 194.25
      },
      {
        "num": "31346",
        "start": "2019-07-08",
        "end": "2019-07-14",
        "amount": 538.83
      },
      {
        "num": "31471",
        "start": "2019-07-15",
        "end": "2019-07-21",
        "amount": 922.81
      },
      {
        "num": "31573",
        "start": "2019-07-22",
        "end": "2019-07-28",
        "amount": 1436.6
      },
      {
        "num": "31757",
        "start": "2019-07-29",
        "end": "2019-08-04",
        "amount": 893.05
      },
      {
        "num": "31853",
        "start": "2019-08-05",
        "end": "2019-08-11",
        "amount": 346.3
      },
      {
        "num": "31976",
        "start": "2019-08-12",
        "end": "2019-08-18",
        "amount": 171.57
      },
      {
        "num": "32080",
        "start": "2019-08-19",
        "end": "2019-08-25",
        "amount": 1718.66
      },
      {
        "num": "32273",
        "start": "2019-08-26",
        "end": "2019-09-01",
        "amount": 638.16
      },
      {
        "num": "32390",
        "start": "2019-09-02",
        "end": "2019-09-08",
        "amount": 70.35
      },
      {
        "num": "32511",
        "start": "2019-09-09",
        "end": "2019-09-15",
        "amount": 259.17
      },
      {
        "num": "32664",
        "start": "2019-09-16",
        "end": "2019-09-22",
        "amount": 2178.8
      },
      {
        "num": "32802",
        "start": "2019-09-23",
        "end": "2019-09-29",
        "amount": 1009.14
      },
      {
        "num": "33026",
        "start": "2019-09-30",
        "end": "2019-10-06",
        "amount": 2325.88
      },
      {
        "num": "33187",
        "start": "2019-10-07",
        "end": "2019-10-13",
        "amount": 1298.62
      },
      {
        "num": "33376",
        "start": "2019-10-14",
        "end": "2019-10-20",
        "amount": 429.37
      },
      {
        "num": "33544",
        "start": "2019-10-21",
        "end": "2019-10-27",
        "amount": 692.53
      },
      {
        "num": "33790",
        "start": "2019-10-28",
        "end": "2019-11-03",
        "amount": 353.39
      },
      {
        "num": "33967",
        "start": "2019-11-04",
        "end": "2019-11-10",
        "amount": 345.91
      },
      {
        "num": "34181",
        "start": "2019-11-11",
        "end": "2019-11-17",
        "amount": 294.74
      },
      {
        "num": "34395",
        "start": "2019-11-18",
        "end": "2019-11-24",
        "amount": 285.46
      },
      {
        "num": "34669",
        "start": "2019-11-25",
        "end": "2019-12-01",
        "amount": 805.29
      },
      {
        "num": "34881",
        "start": "2019-12-02",
        "end": "2019-12-08",
        "amount": 25.3
      },
      {
        "num": "35086",
        "start": "2019-12-09",
        "end": "2019-12-15",
        "amount": 59.03
      },
      {
        "num": "35332",
        "start": "2019-12-16",
        "end": "2019-12-22",
        "amount": 15.52
      },
      {
        "num": "35523",
        "start": "2019-12-23",
        "end": "2019-12-29",
        "amount": 0.12
      },
      {
        "num": "35774",
        "start": "2019-12-30",
        "end": "2020-01-05",
        "amount": 167.41
      },
      {
        "num": "35966",
        "start": "2020-01-06",
        "end": "2020-01-12",
        "amount": 35.27
      },
      {
        "num": "36178",
        "start": "2020-01-13",
        "end": "2020-01-19",
        "amount": 236.28
      },
      {
        "num": "36368",
        "start": "2020-01-20",
        "end": "2020-01-26",
        "amount": 389.67
      },
      {
        "num": "36650",
        "start": "2020-01-27",
        "end": "2020-02-02",
        "amount": 77
      },
      {
        "num": "36861",
        "start": "2020-02-03",
        "end": "2020-02-09",
        "amount": 4.72
      },
      {
        "num": "37095",
        "start": "2020-02-10",
        "end": "2020-02-16",
        "amount": 29.57
      },
      {
        "num": "37326",
        "start": "2020-02-17",
        "end": "2020-02-23",
        "amount": 183.68
      },
      {
        "num": "37612",
        "start": "2020-02-24",
        "end": "2020-03-01",
        "amount": 726.84
      },
      {
        "num": "37850",
        "start": "2020-03-02",
        "end": "2020-03-08",
        "amount": 133.81
      },
      {
        "num": "38079",
        "start": "2020-03-09",
        "end": "2020-03-15",
        "amount": 327.41
      },
      {
        "num": "38355",
        "start": "2020-03-16",
        "end": "2020-03-22",
        "amount": 219.53
      },
      {
        "num": "38593",
        "start": "2020-03-23",
        "end": "2020-03-29",
        "amount": 70.39
      },
      {
        "num": "38908",
        "start": "2020-03-30",
        "end": "2020-04-05",
        "amount": 270.1
      },
      {
        "num": "39160",
        "start": "2020-04-06",
        "end": "2020-04-12",
        "amount": 329.12
      },
      {
        "num": "39428",
        "start": "2020-04-13",
        "end": "2020-04-19",
        "amount": 234.52
      },
      {
        "num": "39663",
        "start": "2020-04-20",
        "end": "2020-04-26",
        "amount": 158.64
      },
      {
        "num": "2020-05-03",
        "start": "2020-04-27",
        "end": "2020-05-03",
        "amount": 309.63
      },
      {
        "num": "40236",
        "start": "2020-05-04",
        "end": "2020-05-10",
        "amount": 513.64
      },
      {
        "num": "40538",
        "start": "2020-05-11",
        "end": "2020-05-17",
        "amount": 195.47
      },
      {
        "num": "40828",
        "start": "2020-05-18",
        "end": "2020-05-24",
        "amount": 205.08
      },
      {
        "num": "41132",
        "start": "2020-05-25",
        "end": "2020-05-31",
        "amount": 59.48
      },
      {
        "num": "41516",
        "start": "2020-06-01",
        "end": "2020-06-07",
        "amount": 216.79
      },
      {
        "num": "41832",
        "start": "2020-06-08",
        "end": "2020-06-14",
        "amount": 183.47
      },
      {
        "num": "42184",
        "start": "2020-06-15",
        "end": "2020-06-21",
        "amount": 31.39
      },
      {
        "num": "42521",
        "start": "2020-06-22",
        "end": "2020-06-28",
        "amount": 0.32
      },
      {
        "num": "43369",
        "start": "2020-07-06",
        "end": "2020-07-12",
        "amount": 0.1
      },
      {
        "num": "43819",
        "start": "2020-07-13",
        "end": "2020-07-19",
        "amount": 18.49
      },
      {
        "num": "44281",
        "start": "2020-07-20",
        "end": "2020-07-26",
        "amount": 59.23
      },
      {
        "num": "44809",
        "start": "2020-07-27",
        "end": "2020-08-02",
        "amount": 195.9
      },
      {
        "num": "45311",
        "start": "2020-08-03",
        "end": "2020-08-09",
        "amount": 257.56
      },
      {
        "num": "45891",
        "start": "2020-08-10",
        "end": "2020-08-16",
        "amount": 184.31
      },
      {
        "num": "46357",
        "start": "2020-08-17",
        "end": "2020-08-23",
        "amount": 1096.33
      },
      {
        "num": "46786",
        "start": "2020-08-24",
        "end": "2020-08-30",
        "amount": 175.58
      },
      {
        "num": "47299",
        "start": "2020-08-31",
        "end": "2020-09-06",
        "amount": 290.09
      },
      {
        "num": "47796",
        "start": "2020-09-07",
        "end": "2020-09-13",
        "amount": 1092.06
      },
      {
        "num": "48266",
        "start": "2020-09-14",
        "end": "2020-09-20",
        "amount": 569.38
      },
      {
        "num": "48709",
        "start": "2020-09-21",
        "end": "2020-09-27",
        "amount": 0.28
      },
      {
        "num": "49211",
        "start": "2020-09-28",
        "end": "2020-10-04",
        "amount": 8.47
      },
      {
        "num": "49697",
        "start": "2020-10-05",
        "end": "2020-10-11",
        "amount": 10.4
      },
      {
        "num": "50215",
        "start": "2020-10-12",
        "end": "2020-10-18",
        "amount": 20.95
      },
      {
        "num": "50713",
        "start": "2020-10-19",
        "end": "2020-10-25",
        "amount": 3.93
      },
      {
        "num": "51257",
        "start": "2020-10-26",
        "end": "2020-11-01",
        "amount": 18.66
      },
      {
        "num": "51751",
        "start": "2020-11-02",
        "end": "2020-11-08",
        "amount": 59.68
      },
      {
        "num": "52232",
        "start": "2020-11-09",
        "end": "2020-11-15",
        "amount": 380.12
      },
      {
        "num": "52733",
        "start": "2020-11-16",
        "end": "2020-11-22",
        "amount": 173.85
      },
      {
        "num": "53213",
        "start": "2020-11-23",
        "end": "2020-11-29",
        "amount": 418.17
      },
      {
        "num": "53752",
        "start": "2020-11-30",
        "end": "2020-12-06",
        "amount": 458.86
      },
      {
        "num": "54186",
        "start": "2020-12-07",
        "end": "2020-12-13",
        "amount": 381.34
      },
      {
        "num": "54657",
        "start": "2020-12-14",
        "end": "2020-12-20",
        "amount": 129.72
      },
      {
        "num": "55054",
        "start": "2020-12-21",
        "end": "2020-12-27",
        "amount": 70.03
      },
      {
        "num": "55462",
        "start": "2020-12-28",
        "end": "2021-01-03",
        "amount": 106.71
      },
      {
        "num": "55859",
        "start": "2021-01-04",
        "end": "2021-01-10",
        "amount": 63.79
      },
      {
        "num": "56264",
        "start": "2021-01-11",
        "end": "2021-01-17",
        "amount": 67.02
      },
      {
        "num": "56627",
        "start": "2021-01-18",
        "end": "2021-01-24",
        "amount": 53.41
      },
      {
        "num": "56968",
        "start": "2021-01-25",
        "end": "2021-01-31",
        "amount": 36.84
      },
      {
        "num": "57371",
        "start": "2021-02-01",
        "end": "2021-02-07",
        "amount": 29.18
      },
      {
        "num": "59939",
        "start": "2021-03-22",
        "end": "2021-03-28",
        "amount": 8.15
      },
      {
        "num": "60348",
        "start": "2021-03-29",
        "end": "2021-04-04",
        "amount": 5.94
      },
      {
        "num": "60837",
        "start": "2021-04-05",
        "end": "2021-04-11",
        "amount": 5.84
      },
      {
        "num": "61298",
        "start": "2021-04-12",
        "end": "2021-04-18",
        "amount": 60.24
      },
      {
        "num": "2021-04-25",
        "start": "2021-04-19",
        "end": "2021-04-25",
        "amount": 66.33
      },
      {
        "num": "2021-05-02",
        "start": "2021-04-26",
        "end": "2021-05-02",
        "amount": 117.63
      },
      {
        "num": "62601",
        "start": "2021-05-03",
        "end": "2021-05-09",
        "amount": 106.31
      },
      {
        "num": "62999",
        "start": "2021-05-10",
        "end": "2021-05-16",
        "amount": 46.05
      },
      {
        "num": "63331",
        "start": "2021-05-17",
        "end": "2021-05-23",
        "amount": 17.43
      },
      {
        "num": "63730",
        "start": "2021-05-24",
        "end": "2021-05-30",
        "amount": 95.97
      },
      {
        "num": "64249",
        "start": "2021-05-31",
        "end": "2021-06-06",
        "amount": 64.64
      },
      {
        "num": "64659",
        "start": "2021-06-07",
        "end": "2021-06-13",
        "amount": 0.38
      },
      {
        "num": "65216",
        "start": "2021-06-14",
        "end": "2021-06-20",
        "amount": 0.17
      },
      {
        "num": "65656",
        "start": "2021-06-21",
        "end": "2021-06-27",
        "amount": 23.8
      },
      {
        "num": "66179",
        "start": "2021-06-28",
        "end": "2021-07-04",
        "amount": 0.62
      },
      {
        "num": "66681",
        "start": "2021-07-05",
        "end": "2021-07-11",
        "amount": 0.16
      },
      {
        "num": "2021-07-18",
        "start": "2021-07-12",
        "end": "2021-07-18",
        "amount": 2.25
      },
      {
        "num": "2021-07-25",
        "start": "2021-07-19",
        "end": "2021-07-25",
        "amount": 6.18
      },
      {
        "num": "68397",
        "start": "2021-07-26",
        "end": "2021-08-01",
        "amount": 92.36
      },
      {
        "num": "68989",
        "start": "2021-08-02",
        "end": "2021-08-08",
        "amount": 702.26
      },
      {
        "num": "69592",
        "start": "2021-08-09",
        "end": "2021-08-15",
        "amount": 237.14
      },
      {
        "num": "70189",
        "start": "2021-08-16",
        "end": "2021-08-22",
        "amount": 217.83
      },
      {
        "num": "70720",
        "start": "2021-08-23",
        "end": "2021-08-29",
        "amount": 586.61
      },
      {
        "num": "71320",
        "start": "2021-08-30",
        "end": "2021-09-05",
        "amount": 783.48
      },
      {
        "num": "71880",
        "start": "2021-09-06",
        "end": "2021-09-12",
        "amount": 146.46
      },
      {
        "num": "2021-09-19",
        "start": "2021-09-13",
        "end": "2021-09-19",
        "amount": 157.91
      },
      {
        "num": "72921",
        "start": "2021-09-20",
        "end": "2021-09-26",
        "amount": 151.53
      },
      {
        "num": "73522",
        "start": "2021-09-27",
        "end": "2021-10-03",
        "amount": 482.81
      },
      {
        "num": "73993",
        "start": "2021-10-04",
        "end": "2021-10-10",
        "amount": 81.9
      },
      {
        "num": "2021-10-17",
        "start": "2021-10-11",
        "end": "2021-10-17",
        "amount": 2253.53
      },
      {
        "num": "2021-10-24",
        "start": "2021-10-18",
        "end": "2021-10-24",
        "amount": 1461.3
      },
      {
        "num": "2021-10-31",
        "start": "2021-10-25",
        "end": "2021-10-31",
        "amount": 39.89
      },
      {
        "num": "75894",
        "start": "2021-11-01",
        "end": "2021-11-07",
        "amount": 46.56
      },
      {
        "num": "76353",
        "start": "2021-11-08",
        "end": "2021-11-14",
        "amount": 2.08
      },
      {
        "num": "76888",
        "start": "2021-11-15",
        "end": "2021-11-21",
        "amount": 0.21
      },
      {
        "num": "77419",
        "start": "2021-11-22",
        "end": "2021-11-28",
        "amount": 114.69
      },
      {
        "num": "77973",
        "start": "2021-11-29",
        "end": "2021-12-05",
        "amount": 62.18
      },
      {
        "num": "78448",
        "start": "2021-12-06",
        "end": "2021-12-12",
        "amount": 1.25
      },
      {
        "num": "79004",
        "start": "2021-12-13",
        "end": "2021-12-19",
        "amount": 169.18
      },
      {
        "num": "79485",
        "start": "2021-12-20",
        "end": "2021-12-26",
        "amount": 178.54
      },
      {
        "num": "79986",
        "start": "2021-12-27",
        "end": "2022-01-02",
        "amount": 233.02
      },
      {
        "num": "2022-01-09",
        "start": "2022-01-03",
        "end": "2022-01-09",
        "amount": 212.31
      },
      {
        "num": "2022-01-16",
        "start": "2022-01-10",
        "end": "2022-01-16",
        "amount": 9.81
      },
      {
        "num": "81703",
        "start": "2022-01-17",
        "end": "2022-01-23",
        "amount": 298.54
      },
      {
        "num": "82214",
        "start": "2022-01-24",
        "end": "2022-01-30",
        "amount": 125.64
      },
      {
        "num": "2022-02-06",
        "start": "2022-01-31",
        "end": "2022-02-06",
        "amount": 1.29
      },
      {
        "num": "2022-02-13",
        "start": "2022-02-07",
        "end": "2022-02-13",
        "amount": 0.81
      },
      {
        "num": "2022-02-20",
        "start": "2022-02-14",
        "end": "2022-02-20",
        "amount": 3.55
      },
      {
        "num": "2022-02-27",
        "start": "2022-02-21",
        "end": "2022-02-27",
        "amount": 25.71
      },
      {
        "num": "2022-03-06",
        "start": "2022-02-28",
        "end": "2022-03-06",
        "amount": 24.6
      },
      {
        "num": "2022-03-13",
        "start": "2022-03-07",
        "end": "2022-03-13",
        "amount": 76.61
      },
      {
        "num": "2022-03-20",
        "start": "2022-03-14",
        "end": "2022-03-20",
        "amount": 30.82
      },
      {
        "num": "2022-03-27",
        "start": "2022-03-21",
        "end": "2022-03-27",
        "amount": 39.28
      },
      {
        "num": "2022-04-03",
        "start": "2022-03-28",
        "end": "2022-04-03",
        "amount": 25.73
      },
      {
        "num": "2022-04-10",
        "start": "2022-04-04",
        "end": "2022-04-10",
        "amount": 0.29
      },
      {
        "num": "2022-04-17",
        "start": "2022-04-11",
        "end": "2022-04-17",
        "amount": 168.49
      },
      {
        "num": "2022-04-24",
        "start": "2022-04-18",
        "end": "2022-04-24",
        "amount": 38.92
      },
      {
        "num": "2022-05-01",
        "start": "2022-04-25",
        "end": "2022-05-01",
        "amount": 6033.83
      },
      {
        "num": "2022-05-08",
        "start": "2022-05-02",
        "end": "2022-05-08",
        "amount": 1513.39
      },
      {
        "num": "2022-05-15",
        "start": "2022-05-09",
        "end": "2022-05-15",
        "amount": 5.72
      },
      {
        "num": "2022-05-22",
        "start": "2022-05-16",
        "end": "2022-05-22",
        "amount": 571.33
      },
      {
        "num": "2022-05-29",
        "start": "2022-05-23",
        "end": "2022-05-29",
        "amount": 1167.69
      },
      {
        "num": "2022-06-05",
        "start": "2022-05-30",
        "end": "2022-06-05",
        "amount": 670.75
      },
      {
        "num": "2022-06-12",
        "start": "2022-06-06",
        "end": "2022-06-12",
        "amount": 478.49
      },
      {
        "num": "93463",
        "start": "2022-06-13",
        "end": "2022-06-19",
        "amount": 154.54
      },
      {
        "num": "94049",
        "start": "2022-06-20",
        "end": "2022-06-26",
        "amount": 217.54
      },
      {
        "num": "94697",
        "start": "2022-06-27",
        "end": "2022-07-03",
        "amount": 199.9
      },
      {
        "num": "95320",
        "start": "2022-07-04",
        "end": "2022-07-10",
        "amount": 80.13
      },
      {
        "num": "95959",
        "start": "2022-07-11",
        "end": "2022-07-17",
        "amount": 131.09
      },
      {
        "num": "96551",
        "start": "2022-07-18",
        "end": "2022-07-24",
        "amount": 54.05
      },
      {
        "num": "97193",
        "start": "2022-07-25",
        "end": "2022-07-31",
        "amount": 21.75
      },
      {
        "num": "97920",
        "start": "2022-08-01",
        "end": "2022-08-07",
        "amount": 549.61
      },
      {
        "num": "98543",
        "start": "2022-08-08",
        "end": "2022-08-14",
        "amount": 5.28
      },
      {
        "num": "99224",
        "start": "2022-08-15",
        "end": "2022-08-21",
        "amount": 0.18
      },
      {
        "num": "99869",
        "start": "2022-08-22",
        "end": "2022-08-28",
        "amount": 314.52
      },
      {
        "num": "100583",
        "start": "2022-08-29",
        "end": "2022-09-04",
        "amount": 211.56
      },
      {
        "num": "101160",
        "start": "2022-09-05",
        "end": "2022-09-11",
        "amount": 235.83
      },
      {
        "num": "101812",
        "start": "2022-09-12",
        "end": "2022-09-18",
        "amount": 109.55
      },
      {
        "num": "102417",
        "start": "2022-09-25",
        "end": "2022-09-29",
        "amount": 54.91
      },
      {
        "num": "103028",
        "start": "2022-09-26",
        "end": "2022-10-02",
        "amount": 98.92
      },
      {
        "num": "103527",
        "start": "2022-10-03",
        "end": "2022-10-09",
        "amount": 115.18
      },
      {
        "num": "104124",
        "start": "2022-10-10",
        "end": "2022-10-16",
        "amount": 126.82
      },
      {
        "num": "104711",
        "start": "2022-10-17",
        "end": "2022-10-23",
        "amount": 36.17
      },
      {
        "num": "105268",
        "start": "2022-10-24",
        "end": "2022-10-30",
        "amount": 102.43
      },
      {
        "num": "105950",
        "start": "2022-10-31",
        "end": "2022-11-06",
        "amount": 378.23
      },
      {
        "num": "106615",
        "start": "2022-11-07",
        "end": "2022-11-13",
        "amount": 119.52
      },
      {
        "num": "107289",
        "start": "2022-11-14",
        "end": "2022-11-20",
        "amount": 134.02
      },
      {
        "num": "107909",
        "start": "2022-11-21",
        "end": "2022-11-27",
        "amount": 315.11
      },
      {
        "num": "108639",
        "start": "2022-11-28",
        "end": "2022-12-04",
        "amount": 113.74
      },
      {
        "num": "109305",
        "start": "2022-12-05",
        "end": "2022-12-11",
        "amount": 88.27
      },
      {
        "num": "109947",
        "start": "2022-12-12",
        "end": "2022-12-18",
        "amount": 99.55
      },
      {
        "num": "110533",
        "start": "2022-12-19",
        "end": "2022-12-25",
        "amount": 91.19
      },
      {
        "num": "111096",
        "start": "2022-12-26",
        "end": "2023-01-01",
        "amount": 53.94
      },
      {
        "num": "111619",
        "start": "2023-01-02",
        "end": "2023-01-08",
        "amount": 30.25
      },
      {
        "num": "112215",
        "start": "2023-01-09",
        "end": "2023-01-15",
        "amount": 41.67
      },
      {
        "num": "112813",
        "start": "2023-01-16",
        "end": "2023-01-22",
        "amount": 75.79
      },
      {
        "num": "113368",
        "start": "2023-01-23",
        "end": "2023-01-29",
        "amount": 124.82
      },
      {
        "num": "114062",
        "start": "2023-01-30",
        "end": "2023-02-05",
        "amount": 135.39
      },
      {
        "num": "114732",
        "start": "2023-02-06",
        "end": "2023-02-12",
        "amount": 78.47
      },
      {
        "num": "115434",
        "start": "2023-02-13",
        "end": "2023-02-19",
        "amount": 153.85
      },
      {
        "num": "116179",
        "start": "2023-02-20",
        "end": "2023-02-26",
        "amount": 95.88
      },
      {
        "num": "117024",
        "start": "2023-02-27",
        "end": "2023-03-05",
        "amount": 105.79
      },
      {
        "num": "117771",
        "start": "2023-03-06",
        "end": "2023-03-12",
        "amount": 87.36
      },
      {
        "num": "118635",
        "start": "2023-03-13",
        "end": "2023-03-19",
        "amount": 43.69
      },
      {
        "num": "119465",
        "start": "2023-03-20",
        "end": "2023-03-26",
        "amount": 70.12
      },
      {
        "num": "120431",
        "start": "2023-03-27",
        "end": "2023-04-02",
        "amount": 35.96
      },
      {
        "num": "121333",
        "start": "2023-04-03",
        "end": "2023-04-09",
        "amount": 21.94
      },
      {
        "num": "122211",
        "start": "2023-04-10",
        "end": "2023-04-16",
        "amount": 439.29
      },
      {
        "num": "122942",
        "start": "2023-04-17",
        "end": "2023-04-23",
        "amount": 292.05
      },
      {
        "num": "123692",
        "start": "2023-04-24",
        "end": "2023-04-30",
        "amount": 362.43
      },
      {
        "num": "124557",
        "start": "2023-05-01",
        "end": "2023-05-07",
        "amount": 85.83
      },
      {
        "num": "125407",
        "start": "2023-05-08",
        "end": "2023-05-14",
        "amount": 213.09
      },
      {
        "num": "126316",
        "start": "2023-05-15",
        "end": "2023-05-21",
        "amount": 12.92
      },
      {
        "num": "127185",
        "start": "2023-05-22",
        "end": "2023-05-28",
        "amount": 4.53
      },
      {
        "num": "128127",
        "start": "2023-05-29",
        "end": "2023-06-04",
        "amount": 10.74
      },
      {
        "num": "128965",
        "start": "2023-06-05",
        "end": "2023-06-11",
        "amount": 1.68
      },
      {
        "num": "129820",
        "start": "2023-06-12",
        "end": "2023-06-18",
        "amount": 0.05
      },
      {
        "num": "130644",
        "start": "2023-06-19",
        "end": "2023-06-25",
        "amount": 0.02
      },
      {
        "num": "131454",
        "start": "2023-06-26",
        "end": "2023-07-02",
        "amount": 0.19
      },
      {
        "num": "132236",
        "start": "2023-07-03",
        "end": "2023-07-09",
        "amount": 0.01
      },
      {
        "num": "133104",
        "start": "2023-07-10",
        "end": "2023-07-16",
        "amount": 0.03
      },
      {
        "num": "133935",
        "start": "2023-07-17",
        "end": "2023-07-23",
        "amount": 0.01
      },
      {
        "num": "134788",
        "start": "2023-07-24",
        "end": "2023-07-30",
        "amount": 0.03
      },
      {
        "num": "135805",
        "start": "2023-07-31",
        "end": "2023-08-06",
        "amount": 0.03
      },
      {
        "num": "136715",
        "start": "2023-08-07",
        "end": "2023-08-13",
        "amount": 67.49
      },
      {
        "num": "137656",
        "start": "2023-08-14",
        "end": "2023-08-20",
        "amount": 0.59
      },
      {
        "num": "138550",
        "start": "2023-08-21",
        "end": "2023-08-27",
        "amount": 0.09
      },
      {
        "num": "139469",
        "start": "2023-08-28",
        "end": "2023-09-03",
        "amount": 0.04
      },
      {
        "num": "140411",
        "start": "2023-09-04",
        "end": "2023-09-10",
        "amount": 0.09
      },
      {
        "num": "141240",
        "start": "2023-09-11",
        "end": "2023-09-17",
        "amount": 0.11
      },
      {
        "num": "142039",
        "start": "2023-09-18",
        "end": "2023-09-24",
        "amount": 1.04
      },
      {
        "num": "142928",
        "start": "2023-09-25",
        "end": "2023-10-01",
        "amount": 0.04
      },
      {
        "num": "143731",
        "start": "2023-10-02",
        "end": "2023-10-08",
        "amount": 0.02
      },
      {
        "num": "144615",
        "start": "2023-10-09",
        "end": "2023-10-15",
        "amount": 0.06
      },
      {
        "num": "145587",
        "start": "2023-10-16",
        "end": "2023-10-22",
        "amount": 0.01
      },
      {
        "num": "146475",
        "start": "2023-10-23",
        "end": "2023-10-29",
        "amount": 0.22
      },
      {
        "num": "147426",
        "start": "2023-10-30",
        "end": "2023-11-05",
        "amount": 0.21
      },
      {
        "num": "148245",
        "start": "2023-11-06",
        "end": "2023-11-12",
        "amount": 7.88
      },
      {
        "num": "149060",
        "start": "2023-11-13",
        "end": "2023-11-19",
        "amount": 0.19
      },
      {
        "num": "149861",
        "start": "2023-11-20",
        "end": "2023-11-26",
        "amount": 0.01
      },
      {
        "num": "152248",
        "start": "2023-12-11",
        "end": "2023-12-17",
        "amount": 0.76
      },
      {
        "num": "152999",
        "start": "2023-12-18",
        "end": "2023-12-24",
        "amount": 353.12
      },
      {
        "num": "153647",
        "start": "2023-12-25",
        "end": "2023-12-31",
        "amount": 143.61
      },
      {
        "num": "154327",
        "start": "2024-01-01",
        "end": "2024-01-07",
        "amount": 0.13
      },
      {
        "num": "155030",
        "start": "2024-01-08",
        "end": "2024-01-14",
        "amount": 0.08
      },
      {
        "num": "155770",
        "start": "2024-01-15",
        "end": "2024-01-21",
        "amount": 0.11
      },
      {
        "num": "156481",
        "start": "2024-01-22",
        "end": "2024-01-28",
        "amount": 0.12
      },
      {
        "num": "157241",
        "start": "2024-01-29",
        "end": "2024-02-04",
        "amount": 0.07
      },
      {
        "num": "158644",
        "start": "2024-02-12",
        "end": "2024-02-18",
        "amount": 0.02
      },
      {
        "num": "159380",
        "start": "2024-02-19",
        "end": "2024-02-25",
        "amount": 0.14
      },
      {
        "num": "160168",
        "start": "2024-02-26",
        "end": "2024-03-03",
        "amount": 0.01
      },
      {
        "num": "160899",
        "start": "2024-03-04",
        "end": "2024-03-10",
        "amount": 0.12
      },
      {
        "num": "161684",
        "start": "2024-03-11",
        "end": "2024-03-17",
        "amount": 0.12
      },
      {
        "num": "162435",
        "start": "2024-03-18",
        "end": "2024-03-24",
        "amount": 0.12
      },
      {
        "num": "163167",
        "start": "2024-03-25",
        "end": "2024-03-31",
        "amount": 0.1
      },
      {
        "num": "163961",
        "start": "2024-04-01",
        "end": "2024-04-07",
        "amount": 0.11
      },
      {
        "num": "164665",
        "start": "2024-04-08",
        "end": "2024-04-14",
        "amount": 0.05
      },
      {
        "num": "165377",
        "start": "2024-04-15",
        "end": "2024-04-21",
        "amount": 0.25
      },
      {
        "num": "166090",
        "start": "2024-04-22",
        "end": "2024-04-28",
        "amount": 0.24
      },
      {
        "num": "166830",
        "start": "2024-04-29",
        "end": "2024-05-05",
        "amount": 40.75
      },
      {
        "num": "167547",
        "start": "2024-05-06",
        "end": "2024-05-12",
        "amount": 3.36
      },
      {
        "num": "168332",
        "start": "2024-05-13",
        "end": "2024-05-19",
        "amount": 67.74
      },
      {
        "num": "169078",
        "start": "2024-05-20",
        "end": "2024-05-26",
        "amount": 36.9
      },
      {
        "num": "169887",
        "start": "2024-05-27",
        "end": "2024-06-02",
        "amount": 28.84
      },
      {
        "num": "170725",
        "start": "2024-06-03",
        "end": "2024-06-09",
        "amount": 0.31
      },
      {
        "num": "171570",
        "start": "2024-06-10",
        "end": "2024-06-16",
        "amount": 56.09
      },
      {
        "num": "172437",
        "start": "2024-06-17",
        "end": "2024-06-23",
        "amount": 249.6
      },
      {
        "num": "173270",
        "start": "2024-06-24",
        "end": "2024-06-30",
        "amount": 12.31
      },
      {
        "num": "174201",
        "start": "2024-07-01",
        "end": "2024-07-07",
        "amount": 0.13
      },
      {
        "num": "175021",
        "start": "2024-07-08",
        "end": "2024-07-14",
        "amount": 337.65
      },
      {
        "num": "175856",
        "start": "2024-07-15",
        "end": "2024-07-21",
        "amount": 180.84
      },
      {
        "num": "176650",
        "start": "2024-07-22",
        "end": "2024-07-28",
        "amount": 397.53
      },
      {
        "num": "177475",
        "start": "2024-07-29",
        "end": "2024-08-04",
        "amount": 400.12
      },
      {
        "num": "178294",
        "start": "2024-08-05",
        "end": "2024-08-11",
        "amount": 794.01
      },
      {
        "num": "179124",
        "start": "2024-08-12",
        "end": "2024-08-18",
        "amount": 146.27
      },
      {
        "num": "179949",
        "start": "2024-08-19",
        "end": "2024-08-25",
        "amount": 161.17
      },
      {
        "num": "180941",
        "start": "2024-08-26",
        "end": "2024-09-01",
        "amount": 206.48
      },
      {
        "num": "181901",
        "start": "2024-09-02",
        "end": "2024-09-08",
        "amount": 20.12
      },
      {
        "num": "182851",
        "start": "2024-09-09",
        "end": "2024-09-15",
        "amount": 45.07
      },
      {
        "num": "183812",
        "start": "2024-09-16",
        "end": "2024-09-22",
        "amount": 27
      },
      {
        "num": "184849",
        "start": "2024-09-23",
        "end": "2024-09-29",
        "amount": 35.46
      },
      {
        "num": "185940",
        "start": "2024-09-30",
        "end": "2024-10-06",
        "amount": 4.04
      },
      {
        "num": "186939",
        "start": "2024-10-07",
        "end": "2024-10-13",
        "amount": 21.23
      },
      {
        "num": "188045",
        "start": "2024-10-14",
        "end": "2024-10-20",
        "amount": 16.57
      },
      {
        "num": "189128",
        "start": "2024-10-21",
        "end": "2024-10-27",
        "amount": 12.89
      },
      {
        "num": "190213",
        "start": "2024-10-28",
        "end": "2024-11-03",
        "amount": 4.44
      },
      {
        "num": "191229",
        "start": "2024-11-04",
        "end": "2024-11-10",
        "amount": 4.73
      },
      {
        "num": "192349",
        "start": "2024-11-11",
        "end": "2024-11-17",
        "amount": 5.57
      },
      {
        "num": "193500",
        "start": "2024-11-18",
        "end": "2024-11-24",
        "amount": 13.05
      },
      {
        "num": "194728",
        "start": "2024-11-25",
        "end": "2024-12-01",
        "amount": 1.01
      },
      {
        "num": "195852",
        "start": "2024-12-02",
        "end": "2024-12-08",
        "amount": 135.26
      },
      {
        "num": "197011",
        "start": "2024-12-09",
        "end": "2024-12-15",
        "amount": 1.12
      },
      {
        "num": "198213",
        "start": "2024-12-16",
        "end": "2024-12-22",
        "amount": 1.56
      },
      {
        "num": "199253",
        "start": "2024-12-23",
        "end": "2024-12-29",
        "amount": 79.14
      },
      {
        "num": "200363",
        "start": "2024-12-30",
        "end": "2025-01-05",
        "amount": 2.71
      },
      {
        "num": "201505",
        "start": "2025-01-06",
        "end": "2025-01-12",
        "amount": 2.17
      },
      {
        "num": "202749",
        "start": "2025-01-13",
        "end": "2025-01-19",
        "amount": 1.28
      },
      {
        "num": "203988",
        "start": "2025-01-20",
        "end": "2025-01-26",
        "amount": 0.57
      },
      {
        "num": "205328",
        "start": "2025-01-27",
        "end": "2025-02-02",
        "amount": 29.21
      },
      {
        "num": "206679",
        "start": "2025-02-03",
        "end": "2025-02-09",
        "amount": 0.56
      },
      {
        "num": "208061",
        "start": "2025-02-10",
        "end": "2025-02-16",
        "amount": 0.44
      },
      {
        "num": "209437",
        "start": "2025-02-17",
        "end": "2025-02-23",
        "amount": 0.46
      },
      {
        "num": "210924",
        "start": "2025-02-24",
        "end": "2025-03-02",
        "amount": 4.95
      },
      {
        "num": "212318",
        "start": "2025-03-03",
        "end": "2025-03-09",
        "amount": 21.09
      },
      {
        "num": "213702",
        "start": "2025-03-10",
        "end": "2025-03-16",
        "amount": 6.84
      },
      {
        "num": "214953",
        "start": "2025-03-17",
        "end": "2025-03-23",
        "amount": 0.19
      },
      {
        "num": "216153",
        "start": "2025-03-24",
        "end": "2025-03-30",
        "amount": 0.42
      },
      {
        "num": "217367",
        "start": "2025-03-31",
        "end": "2025-04-06",
        "amount": 0.49
      },
      {
        "num": "218569",
        "start": "2025-04-07",
        "end": "2025-04-13",
        "amount": 1.85
      },
      {
        "num": "219942",
        "start": "2025-04-14",
        "end": "2025-04-20",
        "amount": 0.25
      },
      {
        "num": "221318",
        "start": "2025-04-21",
        "end": "2025-04-27",
        "amount": 0.64
      },
      {
        "num": "222757",
        "start": "2025-04-28",
        "end": "2025-05-04",
        "amount": 0.08
      },
      {
        "num": "224109",
        "start": "2025-05-05",
        "end": "2025-05-11",
        "amount": 0.22
      },
      {
        "num": "225465",
        "start": "2025-05-12",
        "end": "2025-05-18",
        "amount": 0.26
      },
      {
        "num": "226776",
        "start": "2025-05-19",
        "end": "2025-05-25",
        "amount": 0.67
      },
      {
        "num": "228259",
        "start": "2025-05-26",
        "end": "2025-06-01",
        "amount": 2.7
      },
      {
        "num": "229512",
        "start": "2025-06-02",
        "end": "2025-06-08",
        "amount": 6.49
      },
      {
        "num": "230862",
        "start": "2025-06-09",
        "end": "2025-06-15",
        "amount": 22.07
      },
      {
        "num": "232373",
        "start": "2025-06-16",
        "end": "2025-06-22",
        "amount": 0.61
      },
      {
        "num": "233839",
        "start": "2025-06-23",
        "end": "2025-06-29",
        "amount": 8.19
      },
      {
        "num": "235444",
        "start": "2025-06-30",
        "end": "2025-07-06",
        "amount": 0.45
      },
      {
        "num": "236921",
        "start": "2025-07-07",
        "end": "2025-07-13",
        "amount": 0.37
      },
      {
        "num": "238440",
        "start": "2025-07-14",
        "end": "2025-07-20",
        "amount": 0.31
      },
      {
        "num": "240021",
        "start": "2025-07-21",
        "end": "2025-07-27",
        "amount": 0.38
      },
      {
        "num": "241708",
        "start": "2025-07-28",
        "end": "2025-08-03",
        "amount": 0.42
      },
      {
        "num": "243362",
        "start": "2025-08-04",
        "end": "2025-08-10",
        "amount": 18.51
      },
      {
        "num": "245003",
        "start": "2025-08-11",
        "end": "2025-08-17",
        "amount": 10.85
      },
      {
        "num": "246730",
        "start": "2025-08-18",
        "end": "2025-08-24",
        "amount": 0.81
      },
      {
        "num": "248401",
        "start": "2025-08-25",
        "end": "2025-08-31",
        "amount": 0.39
      },
      {
        "num": "250206",
        "start": "2025-09-01",
        "end": "2025-09-07",
        "amount": 1.27
      },
      {
        "num": "251915",
        "start": "2025-09-08",
        "end": "2025-09-14",
        "amount": 2.18
      },
      {
        "num": "253652",
        "start": "2025-09-15",
        "end": "2025-09-21",
        "amount": 0.17
      },
      {
        "num": "255399",
        "start": "2025-09-22",
        "end": "2025-09-28",
        "amount": 0.21
      },
      {
        "num": "257148",
        "start": "2025-09-29",
        "end": "2025-10-05",
        "amount": 0.16
      },
      {
        "num": "258853",
        "start": "2025-10-06",
        "end": "2025-10-12",
        "amount": 0.27
      },
      {
        "num": "260575",
        "start": "2025-10-13",
        "end": "2025-10-19",
        "amount": 0.16
      },
      {
        "num": "262239",
        "start": "2025-10-20",
        "end": "2025-10-26",
        "amount": 0.08
      },
      {
        "num": "263944",
        "start": "2025-10-27",
        "end": "2025-11-02",
        "amount": 0.53
      },
      {
        "num": "267134",
        "start": "2025-11-10",
        "end": "2025-11-16",
        "amount": 0.23
      },
      {
        "num": "268765",
        "start": "2025-11-17",
        "end": "2025-11-23",
        "amount": 0.3
      },
      {
        "num": "270352",
        "start": "2025-11-24",
        "end": "2025-11-30",
        "amount": 0.1
      },
      {
        "num": "272043",
        "start": "2025-12-01",
        "end": "2025-12-07",
        "amount": 0.3
      },
      {
        "num": "273710",
        "start": "2025-12-08",
        "end": "2025-12-14",
        "amount": 0.44
      },
      {
        "num": "275370",
        "start": "2025-12-15",
        "end": "2025-12-21",
        "amount": 0.36
      },
      {
        "num": "276878",
        "start": "2025-12-22",
        "end": "2025-12-28",
        "amount": 0.12
      },
      {
        "num": "278355",
        "start": "2025-12-29",
        "end": "2026-01-04",
        "amount": 0.41
      },
      {
        "num": "279894",
        "start": "2026-01-05",
        "end": "2026-01-11",
        "amount": 0.19
      },
      {
        "num": "281498",
        "start": "2026-01-12",
        "end": "2026-01-18",
        "amount": 0.12
      },
      {
        "num": "283131",
        "start": "2026-01-19",
        "end": "2026-01-25",
        "amount": 0.07
      },
      {
        "num": "286303",
        "start": "2026-01-26",
        "end": "2026-02-01",
        "amount": 0.04
      },
      {
        "num": "287795",
        "start": "2026-02-09",
        "end": "2026-02-15",
        "amount": 0.11
      },
      {
        "num": "289308",
        "start": "2026-02-16",
        "end": "2026-02-22",
        "amount": 0.05
      },
      {
        "num": "290943",
        "start": "2026-02-23",
        "end": "2026-03-01",
        "amount": 0.11
      },
      {
        "num": "292481",
        "start": "2026-03-02",
        "end": "2026-03-08",
        "amount": 0.05
      },
      {
        "num": "294185",
        "start": "2026-03-09",
        "end": "2026-03-15",
        "amount": 7.35
      },
      {
        "num": "295761",
        "start": "2026-03-16",
        "end": "2026-03-22",
        "amount": 0.01
      },
      {
        "num": "297292",
        "start": "2026-03-23",
        "end": "2026-03-29",
        "amount": 0.01
      },
      {
        "num": "298890",
        "start": "2026-03-30",
        "end": "2026-04-05",
        "amount": 0.01
      },
      {
        "num": "300399",
        "start": "2026-04-06",
        "end": "2026-04-12",
        "amount": 0.05
      },
      {
        "num": "301874",
        "start": "2026-04-13",
        "end": "2026-04-19",
        "amount": 0.03
      },
      {
        "num": "303325",
        "start": "2026-04-20",
        "end": "2026-04-26",
        "amount": 2.94
      },
      {
        "num": "307615",
        "start": "2026-04-27",
        "end": "2026-05-03",
        "amount": 0.01
      },
      {
        "num": "Expected",
        "start": "2026-05-25",
        "end": "2026-05-31",
        "amount": 0.66
      },
      {
        "num": "311975",
        "start": "2026-06-01",
        "end": "2026-06-07",
        "amount": 0.67
      },
      {
        "num": "313426",
        "start": "2026-06-08",
        "end": "2026-06-14",
        "amount": 1.93
      },
      {
        "num": "314954",
        "start": "2026-06-15",
        "end": "2026-06-21",
        "amount": 1.08
      },
      {
        "num": "316375",
        "start": "2026-06-22",
        "end": "2026-06-28",
        "amount": 0.27
      },
      {
        "num": "Expected",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 0.31
      },
      {
        "num": "319192",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 0.42
      },
      {
        "num": "320598",
        "start": "2026-07-13",
        "end": "2026-07-19",
        "amount": 2.54
      },
      {
        "num": "321947",
        "start": "2026-07-20",
        "end": "2026-07-26",
        "amount": 3.68
      },
      {
        "num": "323345",
        "start": "2026-07-27",
        "end": "2026-08-02",
        "amount": 1.61
      },
      {
        "num": "324715",
        "start": "2026-08-03",
        "end": "2026-08-09",
        "amount": 0.01
      }
    ],
    "receipts": [
      {
        "date": "2022-01-18",
        "invoices": "",
        "amount": 95.12
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "phoenos-international-limited",
    "name": "PHOENOS International Limited (Sama)",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000081",
    "accountId": "50a0a000-0000-4000-8000-000000000081",
    "sales": [
      {
        "num": "140539",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 0.03
      },
      {
        "num": "142654",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 38.75
      },
      {
        "num": "143583",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 0.14
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "pldt-hk-limited",
    "name": "PLDT (HK) LIMITED",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000082",
    "accountId": "50a0a000-0000-4000-8000-000000000082",
    "sales": [
      {
        "num": "143729",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 39.54
      }
    ],
    "purchases": [
      {
        "num": "Expected",
        "start": "2026-07-01",
        "end": "2026-07-31",
        "amount": 4019.68
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vonip-ltd",
    "name": "VONIP LTD",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000083",
    "accountId": "50a0a000-0000-4000-8000-000000000083",
    "sales": [
      {
        "num": "119275",
        "start": "2021-12-01",
        "end": "2021-12-15",
        "amount": 0.48
      },
      {
        "num": "119575",
        "start": "2022-01-01",
        "end": "2022-01-15",
        "amount": 36.99
      },
      {
        "num": "119762",
        "start": "2022-01-16",
        "end": "2022-01-31",
        "amount": 4521.98
      },
      {
        "num": "119943",
        "start": "2022-02-01",
        "end": "2022-02-15",
        "amount": 4440.23
      },
      {
        "num": "120094",
        "start": "2022-02-16",
        "end": "2022-02-28",
        "amount": 2120.05
      },
      {
        "num": "120285",
        "start": "2022-03-01",
        "end": "2022-03-15",
        "amount": 3078.72
      },
      {
        "num": "120458",
        "start": "2022-03-16",
        "end": "2022-03-31",
        "amount": 325.13
      },
      {
        "num": "120694",
        "start": "2022-04-01",
        "end": "2022-04-15",
        "amount": 2261.45
      },
      {
        "num": "120877",
        "start": "2022-04-16",
        "end": "2022-04-30",
        "amount": 1711.74
      },
      {
        "num": "121065",
        "start": "2022-05-01",
        "end": "2022-05-15",
        "amount": 2.44
      },
      {
        "num": "121251",
        "start": "2022-05-16",
        "end": "2022-05-31",
        "amount": 3.11
      },
      {
        "num": "121424",
        "start": "2022-06-01",
        "end": "2022-06-15",
        "amount": 9.58
      },
      {
        "num": "121543",
        "start": "2022-06-16",
        "end": "2022-06-30",
        "amount": 989.41
      },
      {
        "num": "121770",
        "start": "2022-07-01",
        "end": "2022-07-15",
        "amount": 798.69
      },
      {
        "num": "121979",
        "start": "2022-07-16",
        "end": "2022-07-31",
        "amount": 259.4
      },
      {
        "num": "122189",
        "start": "2022-08-01",
        "end": "2022-08-15",
        "amount": 18.03
      },
      {
        "num": "122393",
        "start": "2022-08-16",
        "end": "2022-08-31",
        "amount": 19.54
      },
      {
        "num": "122605",
        "start": "2022-09-01",
        "end": "2022-09-15",
        "amount": 321.3
      },
      {
        "num": "122830",
        "start": "2022-09-16",
        "end": "2022-09-30",
        "amount": 3.68
      },
      {
        "num": "123005",
        "start": "2022-10-01",
        "end": "2022-10-15",
        "amount": 1.34
      },
      {
        "num": "123245",
        "start": "2022-10-16",
        "end": "2022-10-31",
        "amount": 2.45
      },
      {
        "num": "123441",
        "start": "2022-11-01",
        "end": "2022-11-15",
        "amount": 7.32
      },
      {
        "num": "123648",
        "start": "2022-11-16",
        "end": "2022-11-30",
        "amount": 19.81
      },
      {
        "num": "123841",
        "start": "2022-12-01",
        "end": "2022-12-15",
        "amount": 3.07
      },
      {
        "num": "124061",
        "start": "2022-12-16",
        "end": "2022-12-31",
        "amount": 9.7
      },
      {
        "num": "124297",
        "start": "2023-01-01",
        "end": "2023-01-15",
        "amount": 4.61
      },
      {
        "num": "124599",
        "start": "2023-01-16",
        "end": "2023-01-31",
        "amount": 1639.31
      },
      {
        "num": "124813",
        "start": "2023-02-01",
        "end": "2023-02-15",
        "amount": 1941
      },
      {
        "num": "125016",
        "start": "2023-02-16",
        "end": "2023-02-28",
        "amount": 15.63
      },
      {
        "num": "125201",
        "start": "2023-03-01",
        "end": "2023-03-15",
        "amount": 6.97
      },
      {
        "num": "125345",
        "start": "2023-03-16",
        "end": "2023-03-31",
        "amount": 116.57
      },
      {
        "num": "125571",
        "start": "2023-04-01",
        "end": "2023-04-15",
        "amount": 1145.38
      },
      {
        "num": "125781",
        "start": "2023-04-16",
        "end": "2023-04-30",
        "amount": 412.94
      },
      {
        "num": "126008",
        "start": "2023-05-01",
        "end": "2023-05-15",
        "amount": 149.81
      },
      {
        "num": "126231",
        "start": "2023-05-16",
        "end": "2023-05-31",
        "amount": 111.5
      },
      {
        "num": "126463",
        "start": "2023-06-01",
        "end": "2023-06-15",
        "amount": 0.26
      },
      {
        "num": "127912",
        "start": "2023-09-01",
        "end": "2023-09-15",
        "amount": 0.92
      },
      {
        "num": "128143",
        "start": "2023-09-16",
        "end": "2023-09-30",
        "amount": 3.29
      },
      {
        "num": "128404",
        "start": "2023-10-01",
        "end": "2023-10-15",
        "amount": 1.38
      },
      {
        "num": "128534",
        "start": "2023-10-16",
        "end": "2023-10-31",
        "amount": 0.35
      },
      {
        "num": "128777",
        "start": "2023-11-01",
        "end": "2023-11-15",
        "amount": 0.64
      },
      {
        "num": "128971",
        "start": "2023-11-16",
        "end": "2023-11-30",
        "amount": 0.23
      },
      {
        "num": "129428",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 0.41
      },
      {
        "num": "129732",
        "start": "2024-01-01",
        "end": "2024-01-15",
        "amount": 0.01
      },
      {
        "num": "131143",
        "start": "2024-04-01",
        "end": "2024-04-15",
        "amount": 4.48
      },
      {
        "num": "131378",
        "start": "2024-04-16",
        "end": "2024-04-30",
        "amount": 0.15
      }
    ],
    "purchases": [
      {
        "num": "INV2111011331",
        "start": "2021-11-01",
        "end": "2021-11-15",
        "amount": 1009.28
      },
      {
        "num": "INV2111161347",
        "start": "2021-11-16",
        "end": "2021-11-30",
        "amount": 1359.3
      },
      {
        "num": "INV2112011376",
        "start": "2021-12-01",
        "end": "2021-12-15",
        "amount": 2554.73
      },
      {
        "num": "INV2112161406",
        "start": "2021-12-16",
        "end": "2021-12-31",
        "amount": 2627.08
      },
      {
        "num": "INV2201011429",
        "start": "2022-01-01",
        "end": "2022-01-15",
        "amount": 3875.46
      },
      {
        "num": "INV2201161458",
        "start": "2022-01-16",
        "end": "2022-01-31",
        "amount": 5211.51
      },
      {
        "num": "INV2202011493",
        "start": "2022-02-01",
        "end": "2022-02-15",
        "amount": 1697.94
      },
      {
        "num": "INV2202161532",
        "start": "2022-02-16",
        "end": "2022-02-28",
        "amount": 1271.74
      },
      {
        "num": "INV2203011567",
        "start": "2022-03-01",
        "end": "2022-03-15",
        "amount": 1094.68
      },
      {
        "num": "INV2203161603",
        "start": "2022-03-16",
        "end": "2022-03-31",
        "amount": 1545.54
      },
      {
        "num": "INV2204011657",
        "start": "2022-04-01",
        "end": "2022-04-15",
        "amount": 1717.92
      },
      {
        "num": "INV2204161695",
        "start": "2022-04-16",
        "end": "2022-04-30",
        "amount": 1866.42
      },
      {
        "num": "INV2205011730",
        "start": "2022-05-01",
        "end": "2022-05-15",
        "amount": 2572.57
      },
      {
        "num": "INV2205161765",
        "start": "2022-05-16",
        "end": "2022-05-31",
        "amount": 1331.88
      },
      {
        "num": "INV2206011791",
        "start": "2022-06-01",
        "end": "2022-06-15",
        "amount": 1021.67
      },
      {
        "num": "INV2206161826",
        "start": "2022-06-16",
        "end": "2022-06-30",
        "amount": 600.95
      },
      {
        "num": "INV2207011884",
        "start": "2022-07-01",
        "end": "2022-07-15",
        "amount": 255.4
      },
      {
        "num": "INV2207161921",
        "start": "2022-07-16",
        "end": "2022-07-31",
        "amount": 749.8
      },
      {
        "num": "INV2208011965",
        "start": "2022-08-01",
        "end": "2022-08-15",
        "amount": 715.75
      },
      {
        "num": "INV2208162002",
        "start": "2022-08-16",
        "end": "2022-08-31",
        "amount": 260.04
      },
      {
        "num": "INV2209012037",
        "start": "2022-09-01",
        "end": "2022-09-15",
        "amount": 556.2
      },
      {
        "num": "INV2209162088",
        "start": "2022-09-16",
        "end": "2022-09-30",
        "amount": 426.69
      },
      {
        "num": "INV2210012123",
        "start": "2022-10-01",
        "end": "2022-10-15",
        "amount": 253.03
      },
      {
        "num": "INV2210162157",
        "start": "2022-10-16",
        "end": "2022-10-31",
        "amount": 140.92
      },
      {
        "num": "INV2211012213",
        "start": "2022-11-01",
        "end": "2022-11-15",
        "amount": 92.14
      },
      {
        "num": "INV2211162262",
        "start": "2022-11-16",
        "end": "2022-11-30",
        "amount": 164.4
      },
      {
        "num": "INV2212012284",
        "start": "2022-12-01",
        "end": "2022-12-15",
        "amount": 232.89
      },
      {
        "num": "INV2212162331",
        "start": "2022-12-16",
        "end": "2022-12-31",
        "amount": 80.83
      },
      {
        "num": "INV2301012364",
        "start": "2023-01-01",
        "end": "2023-01-15",
        "amount": 46
      },
      {
        "num": "INV2301162397",
        "start": "2023-01-16",
        "end": "2023-01-31",
        "amount": 42.5
      },
      {
        "num": "INV2302012432",
        "start": "2023-02-01",
        "end": "2023-02-15",
        "amount": 221.7
      },
      {
        "num": "INV2302162457",
        "start": "2023-02-16",
        "end": "2023-02-28",
        "amount": 203.68
      },
      {
        "num": " 505-156",
        "start": "2023-03-01",
        "end": "2023-03-15",
        "amount": 390.42
      },
      {
        "num": "595-156",
        "start": "2023-03-16",
        "end": "2023-03-31",
        "amount": 2060.08
      },
      {
        "num": "714-156",
        "start": "2023-04-01",
        "end": "2023-04-15",
        "amount": 1252.19
      },
      {
        "num": "811-156",
        "start": "2023-04-16",
        "end": "2023-04-30",
        "amount": 338.38
      },
      {
        "num": "1032-156",
        "start": "2023-05-01",
        "end": "2023-05-15",
        "amount": 59.5
      },
      {
        "num": "1175-156",
        "start": "2023-05-16",
        "end": "2023-05-31",
        "amount": 335.45
      },
      {
        "num": "1337-156",
        "start": "2023-06-01",
        "end": "2023-06-15",
        "amount": 491.17
      },
      {
        "num": "1836-156",
        "start": "2023-06-16",
        "end": "2023-06-30",
        "amount": 19.73
      },
      {
        "num": "2167-156",
        "start": "2023-07-01",
        "end": "2023-07-15",
        "amount": 3.44
      },
      {
        "num": "2600-156\r\n",
        "start": "2023-07-16",
        "end": "2023-07-31",
        "amount": 1.72
      },
      {
        "num": "2942-156",
        "start": "2023-08-01",
        "end": "2023-08-15",
        "amount": 0.66
      },
      {
        "num": "4422-156",
        "start": "2023-09-01",
        "end": "2023-09-15",
        "amount": 0.06
      },
      {
        "num": "6547-156",
        "start": "2023-10-16",
        "end": "2023-10-31",
        "amount": 2.98
      },
      {
        "num": "7264-156",
        "start": "2023-11-01",
        "end": "2023-11-15",
        "amount": 0.02
      },
      {
        "num": "9835-156",
        "start": "2023-12-01",
        "end": "2023-12-31",
        "amount": 0.54
      },
      {
        "num": "14667-156",
        "start": "2024-03-16",
        "end": "2024-03-31",
        "amount": 291.93
      },
      {
        "num": "15361-156",
        "start": "2024-04-01",
        "end": "2024-04-15",
        "amount": 0.13
      },
      {
        "num": "20347-156",
        "start": "2024-07-16",
        "end": "2024-07-31",
        "amount": 336.07
      },
      {
        "num": "21042-156",
        "start": "2024-08-01",
        "end": "2024-08-15",
        "amount": 33.69
      },
      {
        "num": "21761-156",
        "start": "2024-08-16",
        "end": "2024-08-31",
        "amount": 0.3
      },
      {
        "num": "22800-156",
        "start": "2024-09-01",
        "end": "2024-09-15",
        "amount": 2.7
      },
      {
        "num": "23502-156",
        "start": "2024-09-16",
        "end": "2024-09-30",
        "amount": 0.28
      },
      {
        "num": "27404-156",
        "start": "2024-12-01",
        "end": "2024-12-15",
        "amount": 1.39
      },
      {
        "num": "28119-156",
        "start": "2024-12-16",
        "end": "2024-12-31",
        "amount": 0.32
      },
      {
        "num": "29175-156",
        "start": "2025-01-01",
        "end": "2025-01-15",
        "amount": 1.83
      },
      {
        "num": "32803-156",
        "start": "2025-03-16",
        "end": "2025-03-31",
        "amount": 0.43
      },
      {
        "num": "35270-156\r\n",
        "start": "2025-05-01",
        "end": "2025-05-15",
        "amount": 0.44
      },
      {
        "num": "36391-156",
        "start": "2025-05-16",
        "end": "2025-05-31",
        "amount": 0.58
      },
      {
        "num": "36805-156",
        "start": "2025-06-01",
        "end": "2025-06-15",
        "amount": 0.38
      },
      {
        "num": "38759-156",
        "start": "2025-07-01",
        "end": "2025-07-15",
        "amount": 0.95
      },
      {
        "num": "41084-156",
        "start": "2025-08-01",
        "end": "2025-08-15",
        "amount": 0.05
      },
      {
        "num": "41510-156\r\n",
        "start": "2025-08-16",
        "end": "2025-08-31",
        "amount": 0.31
      },
      {
        "num": "42533-156",
        "start": "2025-09-16",
        "end": "2025-09-30",
        "amount": 0.03
      },
      {
        "num": "43281-156\r\n",
        "start": "2025-10-01",
        "end": "2025-10-15",
        "amount": 0.09
      },
      {
        "num": "44080-156",
        "start": "2025-10-16",
        "end": "2025-10-30",
        "amount": 0.2
      },
      {
        "num": "46954-156",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 0.15
      },
      {
        "num": "47759-156",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 0.03
      },
      {
        "num": "52741-156",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 0.09
      },
      {
        "num": "53577-156",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 0.03
      },
      {
        "num": "56582-156",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 0.12
      },
      {
        "num": "57436-156",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 0.07
      }
    ],
    "receipts": [
      {
        "date": "2021-11-30",
        "invoices": "",
        "amount": 5000
      }
    ],
    "payments": [
      {
        "date": "2022-01-10",
        "invoices": "",
        "amount": 7550.39
      },
      {
        "date": "2022-01-24",
        "invoices": "",
        "amount": 3837.99
      },
      {
        "date": "2023-05-10",
        "invoices": "",
        "amount": 7205.28
      }
    ],
    "adjustments": []
  }
];

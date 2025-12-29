import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ExternalHyperlink,

  VerticalPositionAlign,
  HorizontalPositionAlign,
} from "docx";

export const generateSOWDocxFromTemplate = async (task,
  changedFields = {},
  mode = "create", fileType = "SOW") => {
  // Helper function


  const now = new Date();
  const dateSuffix =
    `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;


  // ====== Text Watermark (light gray background text) ======
  const watermarkParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    indent: { left: 10, right: 10 }, // ~10px side margin
    children: [
      new TextRun({
        text: "ACTOWIZ SOLUTIONS",
        color: "E6E6E6", // very light gray (~20% opacity)
        size: 100, // large watermark text
        bold: true,
        font: "Calibri",
      }),
    ],
  });


  const dividerLine = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 300 },
    children: [
      new TextRun({
        text: "______________________________________________________________", // long line
        size: 29,
        color: "000000",
      }),
    ],
  });


  const safeJoin = (val) => {
    if (!val) return "-";
    if (Array.isArray(val)) return val.join(", ");
    return val.toString();
  };

  const freqArray = task.frequency
    ? task.frequency.split(",").map(f => f.trim())
    : [];

  const isRPM = freqArray.includes("RPM");

  const formattedFreq = freqArray.map(f => {
    if (f === "RPM") {
      return `Request-Per-Minute (RPM: ${task.RPM})`;
    }
    return f;
  });



  // 📄 Create DOCX document
  const doc = new Document({
    styles: {
      paragraphStyles: [

      ],
      characterStyles: [
        {
          id: "Hyperlink",
          name: "Hyperlink",
          basedOn: "DefaultParagraphFont",
          run: {
            color: "0000FF",
            underline: "single",
          },
        },
      ],
      default: {
        document: {
          run: { font: "Calibri", color: "000000", size: 24 }, // default font size 12pt (24 half-points)
          paragraph: { spacing: { line: 360 } }, // 1.5 line spacing
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // watermarkParagraph,

          // ===== HEADER =====
          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "🧩 R&D / Feasibility Document",
                bold: true,
                size: 32, // 14pt
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: "Document Type: ",
                bold: true,
                size: 28,
              }),
              new TextRun({
                text: "R&D / Feasibility Assessment",
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Project Title: ", bold: true, size: 28 }),
              new TextRun({ text: task.title || "-", size: 28 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Version: ",

                bold: true,
                size: 28,
              }),
              new TextRun({ text: "1.0", size: 28 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: ", bold: true, size: 28 }),
              new TextRun({
                text: task.date || "-",
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Prepared By: ",
                bold: true,
                size: 28,
              }),
              new TextRun({
                text: "Sales Team – Actowiz Solutions",
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Reviewed By: ",
                bold: true,
                size: 28,
              }),
              new TextRun({
                text: "Tech Management – Actowiz Solutions",
                size: 28,
              }),
            ],
          }),

          dividerLine,

          // ===== 1️⃣ Objective =====
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Objective",
                bold: true,
                size: 24, // 12pt
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `This document outlines the research and feasibility evaluation for implementing a data collection and delivery solution through ${task.typeOfDelivery || "-"
                  } model.  `,
                size: 24,
              }),
              new TextRun({
                text: `Research and feasibility evaluation  `,
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: `for implementing a data collection and delivery solution through`,
                size: 24,
              }),
              new TextRun({
                text: ` ${task.typeOfDelivery || "-"} model.`,
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The objective is to determine the technical, operational, and functional feasibility of extracting and serving structured data from target platforms based on defined input parameters.",
                size: 24,
              }),
            ],
          }),

          dividerLine,

          new Paragraph({
            children: [
              new TextRun({
                text: "2. Project Overview",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The client requires  ",
                size: 24,
              }),
              new TextRun({
                text: task.typeOfDelivery || "-",
                bold: true, // ✅ only this part is bold
                size: 24,
              }),
              new TextRun({
                text: ` solution that fetches and standardizes data from ${task.title || "-"
                  } platforms.`,
                size: 24,
              }),
            ],
          }),

          dividerLine,

          // ===== 3️⃣ Delivery Type =====
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Delivery Type",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "Type: ", bold: true, size: 24 }),
              new TextRun({ text: task.typeOfDelivery || "-", size: 24 }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200, after: 300 },
            border: {
              bottom: { color: "CFCFCF", space: 1, value: "single", size: 6 },
            },
          }),

          dividerLine,

          new Paragraph({
            children: [
              new TextRun({
                text: "4. Platforms Covered",
                bold: true,
                size: 24,
              }),
            ],
          }),
          ...(Array.isArray(task.domains)
            ? task.domains.flatMap((d, i) => [
              new Paragraph({
                indent: { left: 720 },
                children: [
                  new TextRun({
                    text: `${i + 1} Platform Name :- `,
                    bold: true,
                    size: 24,
                  }),
                  new ExternalHyperlink({
                    link: d.name || "",
                    children: [
                      new TextRun({
                        text: d.name || "-",
                        style: "Hyperlink",
                        size: 24,
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({
                indent: { left: 1440 },
                children: [
                  new TextRun({
                    text: `Type of Platform:- ${d.typeOfPlatform || "-"}`,
                    size: 24,
                  }),
                ],
              }),

              new Paragraph({
                indent: { left: 1440 },
                children: [
                  new TextRun({
                    text: `Remarks:- ${d.domainRemarks || "-"}`,
                    size: 24,
                  }),
                ],
              }),
            ])
            : [new Paragraph({ text: "-" })]),


          dividerLine,

          // ===== 5️⃣ Input =====
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Input",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Input Provided from client side: ", bold: true, size: 24 }),
              new ExternalHyperlink({
                link: task.inputDescription || "-", // ✅ your URL
                children: [
                  new TextRun({
                    text: task.inputDescription || "-",
                    style: "Hyperlink",
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "clint sample input Provided: ",
                bold: true,
                size: 24,
              }),
              new ExternalHyperlink({
                link: task.clientSampleSchemaUrls || "-", // ✅ your URL
                children: [
                  new TextRun({
                    text: task.clientSampleSchemaUrls || "-",
                    style: "Hyperlink",
                    size: 24,
                  }),
                ],
              }),
            ],
          }),

          dividerLine,
          // ===== 6️⃣ Outputs =====
          new Paragraph({
            children: [
              new TextRun({
                text: "6. Outputs",
                bold: true,
                size: 24,
              }),
            ],
          }),

          // 1️⃣ Mandatory Fields
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Mandatory Fields:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          ...safeJoin(task.mandatoryFields)
            .split(",")
            .flatMap(
              (f) =>
                new Paragraph({
                  indent: { left: 720 }, // indent (0.5 inch ≈ tab)
                  children: [
                    new TextRun({
                      text: `o ${f.trim()}`, // bullet point with 'o'
                      size: 24,
                    }),
                  ],
                })
            ),

          // 2️⃣ Optional Fields
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: "2. Optional Fields:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          ...safeJoin(task.optionalFields)
            .split(",")
            .flatMap(
              (f) =>
                new Paragraph({
                  indent: { left: 720 },
                  children: [
                    new TextRun({
                      text: `o ${f.trim()}`,
                      size: 24,
                    }),
                  ],
                })
            ),

          // 3️⃣ Output Format
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: "3. Output Format:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({
                text: `o ${safeJoin(task.outputFormat)}`,
                size: 24,
              }),
            ],
          }),

          dividerLine,

          // ===== 7️⃣ Frequency =====
          new Paragraph({
            children: [new TextRun({ text: "7. Frequency", bold: true, size: 24 })],
          }),
          ...formattedFreq.map((f) =>
            new Paragraph({
              indent: { left: 720 },
              children: [new TextRun({ text: `• ${f}`, size: 24 })],
            })
          ),

          dividerLine,
          // ===== 8️⃣ Additional Remarks =====
          new Paragraph({
            children: [
              new TextRun({
                text: "8. Additional Remarks",
                bold: true,
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ${task.description || "-"}`, size: 24 }),

            ],

          }),

          ...(mode === "edit" && Object.keys(changedFields).length > 0
            ? [
              dividerLine,

              new Paragraph({
                children: [],
                pageBreakBefore: true,   // 🔥 forces a new page
              }),


              // Heading Text
              new Paragraph({
                spacing: { before: 300 },
                children: [
                  new TextRun({
                    text: "Additional Requirements can be discussed and accommodated as per client needs.",
                    bold: true,
                    size: 28,
                  }),
                ],
              }),

              // Date Line
              new Paragraph({
                spacing: { before: 100, after: 200 },
                children: [
                  new TextRun({
                    text: `Date: ${new Date().toLocaleDateString("en-GB")}`,
                    size: 24,
                  }),
                ],
              }),

              dividerLine,

              // LOOP through changed fields
              ...Object.entries(changedFields).flatMap(([key, value]) => {

                // ⭐ SPECIAL LOGIC ONLY FOR typeOfDelivery
                if (key === "typeOfDelivery") {
                  return [
                    // ---- 2.1 Project Overview ----
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "2.1 Project Overview",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),
                    new Paragraph({
                      indent: { left: 720 },
                      children: [
                        new TextRun({
                          text: `The client requires a ${value} solution that fetches and standardizes data from ${task.title} platforms.`,
                          size: 24,
                        }),
                      ],
                    }),
                    dividerLine,

                    // ---- 3.1 Delivery Type ----
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "3.1 Delivery Type",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),
                    new Paragraph({
                      indent: { left: 720 },
                      children: [
                        new TextRun({
                          text: `Type: ${value}`,
                          size: 24,
                        }),
                      ],
                    }),

                    dividerLine,
                  ];
                }

                // ⭐ 2️⃣ SPECIAL CASE — domains (list of platforms)
                if (key === "domains") {
                  const domainsArray = Array.isArray(value) ? value : value ? [value] : [];

                  return [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "4.1 Platforms Covered",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),

                    ...domainsArray.flatMap((dom, idx) => [
                      new Paragraph({
                        indent: { left: 720 },
                        children: [
                          new TextRun({
                            text: `${idx + 1}  Platform Name :- ${dom.name || "-"}`,
                            size: 24,
                          }),
                        ],
                      }),

                      new Paragraph({
                        indent: { left: 720 },
                        children: [
                          new TextRun({
                            text: `Platform Type: [${dom.typeOfPlatform || "-"}]`,
                            size: 24,
                          }),
                        ],
                      }),

                      new Paragraph({
                        indent: { left: 720 },
                        children: [
                          new TextRun({
                            text: `Remarks: [${dom.domainRemarks || "-"}]`,
                            size: 24,
                          }),
                        ],
                      }),
                    ]),

                    dividerLine,
                  ];
                }


                if (key === "inputUrls") {
                  return [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Input Description:",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),

                    new Paragraph({
                      indent: { left: 720 },
                      children: [
                        new ExternalHyperlink({
                          link: value,
                          children: [
                            new TextRun({
                              text: value,
                              style: "Hyperlink",
                              size: 24,
                            }),
                          ],
                        }),
                      ],
                    }),


                  ];
                }

                if (key === "clientSampleSchemaUrls") {
                  const urls = Array.isArray(value) ? value : [value];

                  return [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Client Sample Schema URLs:",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),

                    ...urls.flatMap((url) =>
                      new Paragraph({
                        indent: { left: 720 },
                        children: [
                          new ExternalHyperlink({
                            link: url,
                            children: [
                              new TextRun({
                                text: url,
                                style: "Hyperlink",
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      })
                    ),

                    dividerLine,
                  ];
                }

                // ⭐ SPECIAL BULLET LIST FIELDS

                const listFieldMap = {
                  mandatoryFields: "1.1",
                  optionalFields: "2.1",
                  frequency: "3.1",
                  oputputFormat: "4.1",
                  outputFormat: "4.1"
                };

                if (Object.keys(listFieldMap).includes(key)) {
                  const items = Array.isArray(value)
                    ? value
                    : String(value).split(",").map(v => v.trim()).filter(Boolean);

                  const sectionNumber = listFieldMap[key];

                  // Convert key → readable heading
                  const formatted_key =
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, c => c.toUpperCase())
                      .replace("Oputput Format", "Output Format")
                      .replace("Output Format", "Output Format");

                  return [
                    // 🔥 Section Header
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${sectionNumber} ${formatted_key}:`,
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),

                    // 🔥 Bullet list items
                    ...items.map((item) =>
                      new Paragraph({
                        indent: { left: 720 },
                        children: [
                          new TextRun({
                            text: `• ${item}`,
                            size: 24,
                          }),
                        ],
                      })
                    ),

                    dividerLine,
                  ];
                }


                // ⭐ SPECIAL CASE — description → show as "Additional Remarks"
                if (key === "description") {
                  return [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Additional Remarks",
                          bold: true,
                          size: 26,
                        }),
                      ],
                    }),

                    ...(Array.isArray(value)
                      ? value.map((item) =>
                        new Paragraph({
                          indent: { left: 720 },
                          children: [
                            new TextRun({
                              text: `o ${item}`,
                              size: 24,
                            }),
                          ],
                        })
                      )
                      : [
                        new Paragraph({
                          indent: { left: 720 },
                          children: [
                            new TextRun({
                              text: `o ${value}`,
                              size: 24,
                            }),
                          ],
                        }),
                      ]),

                    dividerLine,
                  ];
                }

                // ⭐ DEFAULT FOR OTHER FIELDS
                return [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${key}:`,
                        bold: true,
                        size: 26,
                      }),
                    ],
                  }),
                  new Paragraph({
                    indent: { left: 720 },
                    children: [
                      new TextRun({
                        text: Array.isArray(value)
                          ? value.join(", ")
                          : String(value ?? "-"),
                        size: 24,
                      }),
                    ],
                  }),

                  dividerLine,
                ];
              }),
            ]
            : []),
        ],
      },
    ],
  });


  // 📁 Output directory setup
  const outputDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // 🧾 File name pattern: ProjectName_FileType_Date.docx
  const projectName =
    task.title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "Project";
  const ext = ".docx";
  const fileName = `${projectName}_${fileType}_${dateSuffix}${ext}`;
  const filePath = path.join(outputDir, fileName);

  // 💾 Write file
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  //console.log(`✅ File generated: ${filePath}`);
  return `uploads/${fileName}`;
};

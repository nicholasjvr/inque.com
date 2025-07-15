function addLineItem() {
  const tbody = document.getElementById("lineItemsBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="drag-handle-cell"><span class="material-icons drag-handle">drag_indicator</span></td>
    <td>
      <input type="text" 
        class="service-name" 
        placeholder="Enter service or product name"
        autocomplete="off"
      />
    </td>
    <td>
      <textarea 
        class="service-description" 
        rows="3"
        placeholder="Enter detailed service description including scope, deliverables, and any special requirements"
      ></textarea>
    </td>
    <td>
      <input type="number" 
        class="quantity" 
        placeholder="Qty" 
        min="1" 
        value="1"
      />
    </td>
    <td>
      <input type="number" 
        class="unit-price" 
        placeholder="Price" 
        min="0" 
        step="0.01" 
        value="0.00"
      />
    </td>
    <td>
      <div class="select-container">
        <select class="task-required">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
    </td>
    <td>
      <div class="select-container">
        <select class="accrual">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
    </td>
    <td>
      <button class="remove-btn" onclick="removeRow(this)">
        <span class="material-icons">delete</span>
      </button>
    </td>
  `;

  tbody.appendChild(row);
  // Add auto-resize functionality to the new textarea
  const textarea = row.querySelector(".service-description");

  // Initial height adjustment
  adjustTextareaHeight(textarea);

  // Add input event listener for dynamic resizing
  textarea.addEventListener("input", function () {
    adjustTextareaHeight(this);
  });

  updateLineItemsCount();

  // Resize widget to accommodate new line item
  // resizeWidgetToFitContent(50); // REMOVED
}

function addHeaderRow() {
  const tbody = document.getElementById("lineItemsBody");
  const row = document.createElement("tr");
  row.classList.add("header-row");
  row.innerHTML = `
    <td class="drag-handle-cell"><span class="material-icons drag-handle">drag_indicator</span></td>
    <td colspan="6">
      <input type="text" class="header-title" placeholder="Enter section header" />
    </td>
    <td>
      <button class="remove-btn" onclick="removeRow(this)">
        <span class="material-icons">delete</span>
      </button>
    </td>
  `;
  tbody.appendChild(row);
  updateLineItemsCount();
  // resizeWidgetToFitContent(50); // REMOVED
}

// Patch addLineItem to always add a drag handle cell as first column
const _origAddLineItem = addLineItem;
addLineItem = function () {
  const tbody = document.getElementById("lineItemsBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="drag-handle-cell"><span class="material-icons drag-handle">drag_indicator</span></td>
    <td>
      <input type="text" 
        class="service-name" 
        placeholder="Enter service or product name"
        autocomplete="off"
      />
    </td>
    <td>
      <textarea 
        class="service-description" 
        rows="3"
        placeholder="Enter detailed service description including scope, deliverables, and any special requirements"
      ></textarea>
    </td>
    <td>
      <input type="number" 
        class="quantity" 
        placeholder="Qty" 
        min="1" 
        value="1"
      />
    </td>
    <td>
      <input type="number" 
        class="unit-price" 
        placeholder="Price" 
        min="0" 
        step="0.01" 
        value="0.00"
      />
    </td>
    <td>
      <div class="select-container">
        <select class="task-required">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
    </td>
    <td>
      <div class="select-container">
        <select class="accrual">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
    </td>
    <td>
      <button class="remove-btn" onclick="removeRow(this)">
        <span class="material-icons">delete</span>
      </button>
    </td>
  `;
  tbody.appendChild(row);
  // Add auto-resize functionality to the new textarea
  const textarea = row.querySelector(".service-description");
  adjustTextareaHeight(textarea);
  textarea.addEventListener("input", function () {
    adjustTextareaHeight(this);
  });
  updateLineItemsCount();
  // resizeWidgetToFitContent(50); // REMOVED
};

// On submit, group line items under the most recent header
// (already handled in your submitQuote implementation)

// Function to adjust textarea height
function adjustTextareaHeight(textarea) {
  textarea.style.height = "auto";
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = scrollHeight + "px";

  // Enforce max-height if content is too long
  const maxHeight = parseInt(window.getComputedStyle(textarea).maxHeight);
  if (scrollHeight > maxHeight) {
    textarea.style.height = maxHeight + "px";
    textarea.style.overflowY = "auto";
  } else {
    textarea.style.overflowY = "hidden";
  }
}

function removeRow(button) {
  button.parentElement.parentElement.remove();
  updateLineItemsCount();

  // Resize widget after removing line item
  // resizeWidgetToFitContent(-50); // REMOVED
}

function showToast(message, type = "success", duration = 4000) {
  const toast = document.getElementById("toast");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, duration);
}

function populateDealData(dealData) {
  if (dealData) {
    document.getElementById("quoteName").value = dealData.Deal_Name || "";
    document.getElementById("subject").value = `Quote for ${
      dealData.Deal_Name || "Deal"
    }`;
    document.getElementById("contactId").value =
      dealData.Contact_Name?.id || "";
    document.getElementById("accountId").value =
      dealData.Account_Name?.id || "";
    document.getElementById("dealId").value = dealData.id || "";
    document.getElementById("currency").value = dealData.Currency || "ZAR";
    document.getElementById("validUntil").value = getOneMonthFromToday();
    document.getElementById("ownerId").value = dealData.Owner?.id || "";

    const accountId = dealData.Account_Name?.id;
    if (accountId) {
      ZOHO.CRM.API.getRecord({ Entity: "Accounts", RecordID: accountId })
        .then(function (resp) {
          const acc = resp.data[0];
          document.getElementById("billingStreet").value =
            acc.Billing_Street || "";
          document.getElementById("billingCity").value = acc.Billing_City || "";
          document.getElementById("billingState").value =
            acc.Billing_State || "";
          document.getElementById("billingCode").value = acc.Billing_Code || "";
          document.getElementById("billingCountry").value =
            acc.Billing_Country || "";

          document.getElementById("shippingStreet").value =
            acc.Shipping_Street || "";
          document.getElementById("shippingCity").value =
            acc.Shipping_City || "";
          document.getElementById("shippingState").value =
            acc.Shipping_State || "";
          document.getElementById("shippingCode").value =
            acc.Shipping_Code || "";
          document.getElementById("shippingCountry").value =
            acc.Shipping_Country || "";

          // Resize widget after loading account data
          // resizeWidgetToFitContent(); // REMOVED
        })
        .catch(function (err) {
          console.error("Failed to load Account record:", err);
        });
    }
  }
}

function fetchTermsAndConditions() {
  const termsField = document.getElementById("terms");
  if (!termsField) {
    console.error("Terms field not found in DOM");
    return;
  }

  // Add loading indicator
  termsField.placeholder = "Loading terms and conditions...";
  termsField.disabled = true;

  console.log("Fetching Terms & Conditions...");
  ZOHO.CRM.API.getOrgVariable("quotationtcs")
    .then(function (response) {
      console.log("Terms & Conditions Response:", response);
      termsField.disabled = false;

      if (response && response.Success && response.Success.Content) {
        const terms = response.Success.Content;
        console.log("Terms found:", terms);
        termsField.value = terms;
        termsField.placeholder = "Modify terms and conditions if needed";

        // Resize widget after loading terms
        // resizeWidgetToFitContent(); // REMOVED
      } else {
        console.log("No terms content found in response");
        termsField.placeholder = "Enter terms and conditions";

        // Add a notice above the terms field if no default terms found
        const termsContainer = termsField.parentElement;
        let notice = termsContainer.querySelector(".terms-notice");
        if (!notice) {
          notice = document.createElement("div");
          notice.className = "terms-notice";
          termsContainer.insertBefore(notice, termsField);
        }
        notice.textContent =
          "No default terms found. Please enter your terms and conditions.";

        // Resize widget after adding notice
        // resizeWidgetToFitContent(); // REMOVED
      }
    })
    .catch(function (error) {
      console.error("Failed to fetch Terms & Conditions:", error);
      termsField.disabled = false;
      termsField.placeholder = "Enter terms and conditions";

      // Add error notice
      const termsContainer = termsField.parentElement;
      let notice = termsContainer.querySelector(".terms-notice");
      if (!notice) {
        notice = document.createElement("div");
        notice.className = "terms-notice error";
        termsContainer.insertBefore(notice, termsField);
      }
      notice.textContent =
        "Could not load default terms. Please enter your terms and conditions.";
    });
}

ZOHO.embeddedApp.on("PageLoad", function (data) {
  // Initialize the widget
  ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: data.EntityId })
    .then(function (response) {
      const dealInfo = response.data[0];
      populateDealData(dealInfo);
      // Fetch Terms and Conditions after populating deal data
      fetchTermsAndConditions();
    })
    .catch(function (error) {
      console.error("Failed to load deal context:", error);
      // Still try to fetch Terms and Conditions even if deal loading fails
      fetchTermsAndConditions();
    });
});

// Make sure ZOHO.embeddedApp.init() is called only once
ZOHO.embeddedApp.init();

function validateQuoteStage() {
  const quoteStage = document.getElementById("quoteStage");
  const quoteStageGroup = document.getElementById("quoteStageGroup");

  if (!quoteStage.value) {
    quoteStageGroup.classList.add("error");
    return false;
  } else {
    quoteStageGroup.classList.remove("error");
    return true;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Set default quote stage to "Draft"
  const quoteStageSelect = document.getElementById("quoteStage");
  if (quoteStageSelect) {
    quoteStageSelect.value = "Draft";
  }
  const validUntil = document.getElementById("validUntil");
  if (validUntil && !validUntil.value) {
    validUntil.value = getOneMonthFromToday();
  }
});

// Utility to get date string one month from today in YYYY-MM-DD format
function getOneMonthFromToday() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3)
  if (date.getDate() !== new Date().getDate()) {
    date.setDate(0); // Go to last day of previous month
  }
  return date.toISOString().split("T")[0];
}

/**
 * Submits the quote data to Zoho Flow and creates a CRM quote record
 * Also triggers a blueprint workflow for quote approval process (if Flow succeeded)
 */
async function submitQuote() {
  if (!validateQuoteStage()) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const lineItems = [];
  const rows = document.querySelectorAll("#lineItemsBody tr");

  rows.forEach((row) => {
    // Skip header rows
    if (row.classList.contains("header-row")) return;

    // Use optional chaining to avoid null errors
    const serviceName = row.querySelector(".service-name")?.value || "";
    const serviceDescription =
      row.querySelector(".service-description")?.value || "";
    const quantity = row.querySelector(".quantity")?.value || "1";
    const unitPrice = row.querySelector(".unit-price")?.value || "0";
    const taskRequired = row.querySelector(".task-required")?.value || "No";
    const accrual = row.querySelector(".accrual")?.value || "No";

    // Find the most recent header above this row
    let headerName = "";
    let previousRow = row.previousElementSibling;
    while (previousRow) {
      if (previousRow.classList.contains("header-row")) {
        const headerTitleInput = previousRow.querySelector(".header-title");
        headerName = headerTitleInput?.value || "";
        break;
      }
      previousRow = previousRow.previousElementSibling;
    }

    lineItems.push({
      header_name: headerName,
      Product_Name: serviceName || "-",
      Item_Description: serviceDescription || "-",
      Quantity: parseFloat(quantity) || 1,
      List_Price: parseFloat(unitPrice) || 0,
      Task_Required: taskRequired || "No",
      Accrual: accrual || "No",
    });
  });

  const nameField = document.getElementById("quoteName").value.trim();
  const autoGeneratedName = "Q-" + new Date().getTime();

  const quoteData = {
    Name: nameField !== "" ? nameField : autoGeneratedName,
    Subject: document.getElementById("subject").value || "-",
    Contact_Name: document.getElementById("contactId").value,
    Account_Name: document.getElementById("accountId").value,
    Deal_Name: document.getElementById("dealId").value,
    Quote_Stage: document.getElementById("quoteStage").value,
    Exchange_Rate: document.getElementById("exchangeRate")
      ? parseFloat(document.getElementById("exchangeRate").value || 1)
      : 1,
    Currency: document.getElementById("currency").value,
    Valid_Until: document.getElementById("validUntil").value,
    Quote_Items: lineItems,
    Billing_Street: document.getElementById("billingStreet").value || "",
    Billing_City: document.getElementById("billingCity").value || "",
    Billing_State: document.getElementById("billingState").value || "",
    Billing_Code: document.getElementById("billingCode").value || "",
    Billing_Country: document.getElementById("billingCountry").value || "",
    Shipping_Street: document.getElementById("shippingStreet").value || "",
    Shipping_City: document.getElementById("shippingCity").value || "",
    Shipping_State: document.getElementById("shippingState").value || "",
    Shipping_Code: document.getElementById("shippingCode").value || "",
    Shipping_Country: document.getElementById("shippingCountry").value || "",
    Terms_and_Conditions: document.getElementById("terms")?.value || "",
    Owner: document.getElementById("ownerId").value,
  };

  showToast("Sending quote to Zoho Flow for processing...", "info");
  try {
    const response = await postToZohoFlowWebhook(quoteData);
    if (response.code === "success") {
      console.log("Deluge function output:", response.details.output);
      showToast("Quote sent to Zoho Flow successfully!", "success");
      const crmQuoteData = { ...quoteData };
      delete crmQuoteData.Quote_Items;
      const crmResponse = await ZOHO.CRM.API.insertRecord({
        Entity: "Quotations",
        APIData: crmQuoteData,
        Trigger: ["workflow"],
      });
      const record = crmResponse.data[0];
      if (record.code === "SUCCESS") {
        showToast("CRM Quote record created successfully!", "success");
        const quoteId = record.details.id;
        const dealId = document.getElementById("dealId").value;

        // Close the popup first
        if (
          window.ZOHO &&
          ZOHO.CRM &&
          ZOHO.CRM.UI &&
          ZOHO.CRM.UI.Popup &&
          ZOHO.CRM.UI.Popup.close
        ) {
          ZOHO.CRM.UI.Popup.close();
        }

        // Trigger the Deals blueprint to proceed the deal workflow
        if (dealId) {
          try {
            const dealBlueprintConfig = {
              Entity: "Deals",
              RecordID: dealId,
            };

            console.log(
              "Triggering Deals blueprint with config:",
              dealBlueprintConfig
            );

            if (
              window.ZOHO &&
              ZOHO.CRM &&
              ZOHO.CRM.API &&
              ZOHO.CRM.API.Blueprint &&
              typeof ZOHO.CRM.API.Blueprint.proceed === "function"
            ) {
              const blueprintResponse = await ZOHO.CRM.API.Blueprint.proceed(
                dealBlueprintConfig
              );
              console.log("Deals blueprint response:", blueprintResponse);

              if (blueprintResponse.code === "SUCCESS") {
                console.log("Deals blueprint workflow triggered successfully!");
              } else {
                console.warn(
                  "Deals blueprint workflow warning:",
                  blueprintResponse.message
                );
              }
            } else {
              console.warn("Blueprint API not available for Deals workflow");
            }
          } catch (blueprintError) {
            console.warn(
              "Deals blueprint workflow failed:",
              blueprintError.message
            );
          }
        } else {
          console.warn("No Deal ID available for blueprint trigger");
        }
      } else {
        console.error("Failed to create CRM quote record:", record.message);
        showToast(`Error creating CRM quote: ${record.message}`, "error");
      }
    } else {
      console.error("Deluge function error:", response);
      showToast(`Flow trigger failed: ${response.message}`, "error");
    }
  } catch (error) {
    console.error("Overall process error:", error);
    showToast("An error occurred during the quote creation process.", "error");
  }
}

function handleFileImport(event) {
  const file = event.target.files[0];
  const importStatus = document.getElementById("importStatus");

  if (!file) return;

  importStatus.textContent = "Processing file...";
  importStatus.className = "import-status processing";

  // Resize widget when import status changes
  // resizeWidgetToFitContent(); // REMOVED

  const fileType = file.name.split(".").pop().toLowerCase();

  if (fileType === "csv") {
    handleCSVFile(file);
  } else if (["xlsx", "xls"].includes(fileType)) {
    handleExcelFile(file);
  } else {
    importStatus.textContent =
      "Unsupported file type. Please use CSV or Excel files.";
    importStatus.className = "import-status error";

    // Resize widget when showing error status
    // resizeWidgetToFitContent(); // REMOVED
  }
}

function handleCSVFile(file) {
  const reader = new FileReader();
  const importStatus = document.getElementById("importStatus");

  reader.onload = function (e) {
    try {
      const text = e.target.result;
      const rows = text.split("\n").map((row) => row.split(","));
      processImportedData(rows);
    } catch (error) {
      console.error("CSV Import error:", error);
      importStatus.textContent = `Import failed: ${error.message}`;
      importStatus.className = "import-status error";

      // Resize widget when showing error
      // resizeWidgetToFitContent(); // REMOVED
    }
  };

  reader.onerror = function () {
    importStatus.textContent = "Error reading file";
    importStatus.className = "import-status error";
    // Resize widget when showing error
    // resizeWidgetToFitContent(); // REMOVED
  };

  reader.readAsText(file);
}

function handleExcelFile(file) {
  const reader = new FileReader();
  const importStatus = document.getElementById("importStatus");

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      processImportedData(rows);
    } catch (error) {
      console.error("Excel Import error:", error);
      importStatus.textContent = `Import failed: ${error.message}`;
      importStatus.className = "import-status error";
    }
  };

  reader.onerror = function () {
    importStatus.textContent = "Error reading file";
    importStatus.className = "import-status error";
    // Resize widget when showing error
    // resizeWidgetToFitContent(); // REMOVED
  };

  reader.readAsArrayBuffer(file);
}

function processImportedData(rows) {
  const importStatus = document.getElementById("importStatus");
  try {
    const headers = rows[0].map((header) => header.trim());

    // Validate headers
    const requiredHeaders = [
      "Header",
      "Service/Product",
      "Description",
      "Quantity",
      "Unit Price",
      "Task Required",
      "Accrual",
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    // Do NOT clear existing line items; just append new ones
    const tbody = document.getElementById("lineItemsBody");

    let currentHeader = null;
    let headerRow = null;

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].length || rows[i].every((cell) => !cell)) continue;

      const row = rows[i];
      const rowHeader = (row[headers.indexOf("Header")] || "")
        .toString()
        .trim();

      // Check if we need a new header row
      if (rowHeader && rowHeader !== currentHeader) {
        currentHeader = rowHeader;

        // Add header row
        addHeaderRow();
        headerRow = tbody.lastElementChild;

        // Set the header title
        const headerTitleInput = headerRow.querySelector(".header-title");
        if (headerTitleInput) {
          headerTitleInput.value = currentHeader;
        }
      }

      // Add line item
      addLineItem();
      const tableRow = tbody.lastElementChild;

      // Fill in the values
      tableRow.querySelector(".service-name").value = (
        row[headers.indexOf("Service/Product")] || ""
      )
        .toString()
        .trim();
      tableRow.querySelector(".service-description").value = (
        row[headers.indexOf("Description")] || ""
      )
        .toString()
        .trim();
      // Ensure quantity is a valid number
      const quantityValue = (row[headers.indexOf("Quantity")] || "1")
        .toString()
        .trim();
      const quantityInput = tableRow.querySelector(".quantity");
      if (isNaN(parseFloat(quantityValue))) {
        quantityInput.value = "1";
        quantityInput.classList.add("input-error");
      } else {
        quantityInput.value = quantityValue;
        quantityInput.classList.remove("input-error");
      }

      // Ensure unit price is a valid number
      const priceValue = (row[headers.indexOf("Unit Price")] || "0")
        .toString()
        .trim();
      const priceInput = tableRow.querySelector(".unit-price");
      if (isNaN(parseFloat(priceValue))) {
        priceInput.value = "0";
        priceInput.classList.add("input-error");
      } else {
        priceInput.value = priceValue;
        priceInput.classList.remove("input-error");
      }

      tableRow.querySelector(".task-required").value = (
        row[headers.indexOf("Task Required")] || "No"
      )
        .toString()
        .trim();
      tableRow.querySelector(".accrual").value = (
        row[headers.indexOf("Accrual")] || "No"
      )
        .toString()
        .trim();
    }

    importStatus.textContent = "Import successful!";
    importStatus.className = "import-status success";

    // Resize widget after importing items
    const importedRows = rows.length - 1; // Subtract header row
    // resizeWidgetToFitContent(importedRows * 50); // REMOVED
  } catch (error) {
    console.error("Import error:", error);
    importStatus.textContent = `Import failed: ${error.message}`;
    importStatus.className = "import-status error";
  }

  updateLineItemsCount();
}

function downloadTemplate(format = "csv") {
  const headers = [
    "Header",
    "Service/Product",
    "Description",
    "Quantity",
    "Unit Price",
    "Task Required",
    "Accrual",
  ];
  const sampleData = [
    [
      "Hardware & Equipment",
      "Dell Latitude Laptop",
      "Dell Latitude 5520, Intel i7, 16GB RAM, 512GB SSD, Windows 11 Pro",
      "2",
      "2500.00",
      "Yes",
      "No",
    ],
    [
      "Hardware & Equipment",
      "Dell Docking Station",
      "Dell WD19S 130W Docking Station with USB-C connection",
      "2",
      "350.00",
      "Yes",
      "No",
    ],
    [
      "Software Licenses",
      "Microsoft 365 Business Premium",
      "Annual subscription for Microsoft 365 Business Premium per user",
      "2",
      "180.00",
      "No",
      "Yes",
    ],
    [
      "Professional Services",
      "System Setup & Configuration",
      "Initial setup, software installation, and user configuration for new equipment",
      "1",
      "500.00",
      "Yes",
      "No",
    ],
    [
      "Professional Services",
      "User Training",
      "2-hour training session for new software and hardware usage",
      "1",
      "300.00",
      "Yes",
      "No",
    ],
  ];

  if (format === "csv") {
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    downloadFile(blob, "quote_items_template.csv");
  } else if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quote Items");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadFile(blob, "quote_items_template.xlsx");
  }
}

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Resizes the widget to fit its content dynamically
 * @param {number} extraHeight - Additional height to add (default: 0)
 */
function resizeWidgetToFitContent(extraHeight = 0) {
  setTimeout(() => {
    try {
      const body = document.body;
      const height = body.scrollHeight + extraHeight;
      // Set a minimum width, e.g., 900px
      const width = Math.max(body.scrollWidth, 900);

      if (window.ZOHO && ZOHO.CRM && ZOHO.CRM.UI && ZOHO.CRM.UI.Resize) {
        ZOHO.CRM.UI.Resize({ height, width });
      } else if (window.ZOHO && ZOHO.embeddedApp && ZOHO.embeddedApp.resize) {
        ZOHO.embeddedApp.resize({ height, width });
      }

      console.log(`Widget resized to: ${width}x${height}`);
    } catch (error) {
      console.log(
        "Widget resize skipped - not in Zoho CRM context:",
        error.message
      );
    }
  }, 100);
}

function setWidgetSize() {
  setTimeout(() => {
    try {
      const container = document.querySelector(".widget-container");
      const width = container ? container.offsetWidth : 1000;
      const height = Math.max(document.body.scrollHeight, 600);

      if (window.ZOHO && ZOHO.CRM && ZOHO.CRM.UI && ZOHO.CRM.UI.Resize) {
        ZOHO.CRM.UI.Resize({ height, width });
      } else if (window.ZOHO && ZOHO.embeddedApp && ZOHO.embeddedApp.resize) {
        ZOHO.embeddedApp.resize({ height, width });
      }

      console.log(`Widget resized to: ${width}x${height}`);
    } catch (error) {
      console.log(
        "Widget resize skipped - not in Zoho CRM context:",
        error.message
      );
    }
  }, 100);
}

window.onload = () => {
  addHeaderRow();
  addLineItem();
  console.log("INITIATED THE WIDGIE");

  setWidgetSize(); // Only call ONCE here

  // Add initial validation check
  const quoteStage = document.getElementById("quoteStage");
  quoteStage.addEventListener("blur", validateQuoteStage);

  // Add file import handler
  const csvFile = document.getElementById("csvFile");
  csvFile.addEventListener("change", handleFileImport);

  // Add template download handlers
  const downloadTemplateBtn = document.getElementById("downloadTemplate");
  downloadTemplateBtn.addEventListener("click", function (e) {
    e.preventDefault();
    downloadTemplate("csv");
  });

  const downloadExcelTemplateBtn = document.getElementById(
    "downloadExcelTemplate"
  );
  downloadExcelTemplateBtn.addEventListener("click", function (e) {
    e.preventDefault();
    downloadTemplate("xlsx");
  });

  // Validate on form submit
  document.querySelector("form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateQuoteStage()) {
      submitQuote();
    }
  });

  // Initialize SortableJS for drag-and-drop reordering
  console.log("Sortable is", typeof Sortable, Sortable);
  const tbody = document.getElementById("lineItemsBody");
  console.log("tbody is", tbody);
  if (window.Sortable && tbody) {
    console.log("Initializing SortableJS...");
    Sortable.create(tbody, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
    });
  } else {
    console.warn("SortableJS or tbody not available!");
  }
};

function updateLineItemsCount() {
  const count = document.querySelectorAll("#lineItemsBody tr").length;
  const countElem = document.getElementById("lineItemsCountValue");
  if (countElem) {
    countElem.textContent = count;
  }
}

/**
 * Triggers a Zoho CRM Blueprint workflow for the specified quote record
 * @param {string} recordId - The ID of the quote record to trigger the workflow for
 * @returns {Promise} - Promise that resolves with the blueprint workflow response
 */
function triggerBlueprintWorkflow(recordId) {
  // Only proceed the next available transition for the Quotes blueprint
  const blueprintConfig = {
    Entity: "Quotations",
    RecordID: recordId,
  };

  console.log("Triggering blueprint workflow with config:", blueprintConfig);
  console.log("ZOHO object available:", !!window.ZOHO);
  console.log("ZOHO.CRM available:", !!(window.ZOHO && ZOHO.CRM));
  console.log(
    "ZOHO.CRM.API available:",
    !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API)
  );
  console.log(
    "ZOHO.CRM.API.Blueprint available:",
    !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.Blueprint)
  );
  console.log(
    "ZOHO.CRM.API.Blueprint.proceed available:",
    !!(
      window.ZOHO &&
      ZOHO.CRM &&
      ZOHO.CRM.API &&
      ZOHO.CRM.API.Blueprint &&
      typeof ZOHO.CRM.API.Blueprint.proceed === "function"
    )
  );

  if (
    !window.ZOHO ||
    !ZOHO.CRM ||
    !ZOHO.CRM.API ||
    !ZOHO.CRM.API.Blueprint ||
    typeof ZOHO.CRM.API.Blueprint.proceed !== "function"
  ) {
    console.warn(
      "Blueprint API not available. Available APIs:",
      Object.keys(ZOHO?.CRM?.API || {})
    );
    return Promise.reject(
      new Error("Blueprint API is not available in this context.")
    );
  }

  return ZOHO.CRM.API.Blueprint.proceed(blueprintConfig)
    .then(function (response) {
      console.log("Blueprint workflow response:", response);
      return response;
    })
    .catch(function (error) {
      console.error("Blueprint workflow error:", error);
      // Return a structured error response to maintain promise chain
      return {
        code: "ERROR",
        message: error.message || "Blueprint workflow failed",
        details: error,
      };
    });
}

function postToZohoFlowWebhook(payload) {
  // We will call a Deluge function to proxy the request and avoid CORS errors.
  const functionName = "create_books_quote_via_flow";
  const reqData = {
    arguments: JSON.stringify({
      quote_payload: payload,
    }),
  };
  return ZOHO.CRM.FUNCTIONS.execute(functionName, reqData);
}

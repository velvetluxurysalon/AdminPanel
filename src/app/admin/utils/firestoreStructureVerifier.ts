/**
 * FIRESTORE DATA STRUCTURE VERIFICATION
 *
 * This file contains utilities to verify your Firestore structure
 * matches what the analytics dashboard expects.
 */

import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

interface FirestoreVerificationResult {
  collection: string;
  exists: boolean;
  sampleCount: number;
  sampleDocument?: any;
  requiredFields: string[];
  missingFields: string[];
  status: "✓" | "✗" | "⚠";
  message: string;
}

/**
 * Verify Firestore Collections Structure
 */
export const verifyFirestoreStructure = async (): Promise<
  FirestoreVerificationResult[]
> => {
  const results: FirestoreVerificationResult[] = [];

  // Collection structure templates
  const REQUIRED_STRUCTURES = {
    invoices: {
      requiredFields: [
        "invoiceId",
        "invoiceDate",
        "paidAmount",
        "paymentMode",
        "customerId",
        "items",
      ],
    },
    visits: {
      requiredFields: ["date", "status", "customerId", "items"],
    },
    customers: {
      requiredFields: ["name", "phone"],
    },
    services: {
      requiredFields: ["name", "price"],
    },
    staff: {
      requiredFields: ["name", "id"],
    },
  };

  // Check each collection
  for (const [collectionName, config] of Object.entries(REQUIRED_STRUCTURES)) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, limit(1));
      const snapshot = await getDocs(q);

      const exists = snapshot.size > 0;
      const sampleDocument = snapshot.docs[0]?.data() || null;

      let missingFields: string[] = [];
      if (sampleDocument) {
        missingFields = config.requiredFields.filter(
          (field) => !(field in sampleDocument),
        );
      }

      const collectionSize = (await getDocs(collection(db, collectionName)))
        .size;

      results.push({
        collection: collectionName,
        exists,
        sampleCount: collectionSize,
        sampleDocument: sampleDocument
          ? JSON.stringify(sampleDocument)
          : undefined,
        requiredFields: config.requiredFields,
        missingFields,
        status:
          missingFields.length === 0 && exists
            ? "✓"
            : missingFields.length === 0 && !exists
              ? "⚠"
              : "✗",
        message: !exists
          ? `⚠ Collection exists but is empty. ${collectionName} needs data for analytics to work.`
          : missingFields.length === 0
            ? `✓ Collection verified successfully with ${collectionSize} documents.`
            : `✗ Missing fields: ${missingFields.join(", ")}`,
      });
    } catch (error) {
      results.push({
        collection: collectionName,
        exists: false,
        sampleCount: 0,
        requiredFields: config.requiredFields,
        missingFields: config.requiredFields,
        status: "✗",
        message: `✗ Error accessing collection: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  return results;
};

/**
 * Check Payment Mode Consistency
 */
export const verifyPaymentModes = async (): Promise<{
  validModes: string[];
  unusualModes: string[];
  totalInvoices: number;
  modeBreakdown: Record<string, number>;
}> => {
  try {
    const invoicesRef = collection(db, "invoices");
    const invoicesSnap = await getDocs(invoicesRef);
    const invoices = invoicesSnap.docs.map((doc) => doc.data());

    const validModes = ["cash", "card", "upi", "wallet"];
    const modeBreakdown: Record<string, number> = {};
    const unusualModes = new Set<string>();

    invoices.forEach((invoice: any) => {
      const mode = (invoice.paymentMode || "unknown").toLowerCase();

      if (validModes.includes(mode)) {
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
      } else {
        unusualModes.add(mode);
      }
    });

    // Ensure all valid modes are in breakdown
    validModes.forEach((mode) => {
      if (!(mode in modeBreakdown)) {
        modeBreakdown[mode] = 0;
      }
    });

    return {
      validModes,
      unusualModes: Array.from(unusualModes),
      totalInvoices: invoices.length,
      modeBreakdown,
    };
  } catch (error) {
    console.error("Error verifying payment modes:", error);
    throw error;
  }
};

/**
 * Generate Data Structure Report
 */
export const generateStructureReport = async (): Promise<string> => {
  console.log("🔍 Starting Firestore Structure Verification...\n");

  const results = await verifyFirestoreStructure();
  const paymentModes = await verifyPaymentModes();

  let report = "📊 FIRESTORE STRUCTURE VERIFICATION REPORT\n";
  report += "==========================================\n\n";

  // Collection Status
  report += "Collections Status:\n";
  report += "-------------------\n";
  results.forEach((result) => {
    report += `${result.status} ${result.collection.toUpperCase()}\n`;
    report += `   Status: ${result.message}\n`;
    if (result.missingFields.length > 0) {
      report += `   Missing: ${result.missingFields.join(", ")}\n`;
    }
    report += `\n`;
  });

  // Payment Modes
  report += "\nPayment Mode Analysis:\n";
  report += "----------------------\n";
  report += `Total Invoices: ${paymentModes.totalInvoices}\n`;
  report += `Valid Modes: ${paymentModes.validModes.join(", ")}\n`;
  report += `\nBreakdown:\n`;

  Object.entries(paymentModes.modeBreakdown).forEach(([mode, count]) => {
    const percentage = ((count / paymentModes.totalInvoices) * 100).toFixed(1);
    report += `  ${mode}: ${count} (${percentage}%)\n`;
  });

  if (paymentModes.unusualModes.length > 0) {
    report += `\n⚠️  Unusual modes found: ${paymentModes.unusualModes.join(", ")}\n`;
  }

  // Overall Status
  report += "\n\nOverall Status:\n";
  report += "---------------\n";
  const allGood = results.every((r) => r.status === "✓");
  const hasIssues = results.some((r) => r.status === "✗");

  if (allGood) {
    report += "✓ All collections are properly structured!\n";
    report += "✓ Dashboard should work without issues.\n";
  } else if (hasIssues) {
    report += "✗ Some collections have issues that need to be fixed.\n";
    report += "✗ Please review the errors above.\n";
  } else {
    report +=
      "⚠ Some collections are empty. Dashboard will work but with limited data.\n";
  }

  return report;
};

/**
 * Sample Data Generator for Testing
 * Only use this in development/testing environments!
 */
export const generateSampleData = async () => {
  console.log(
    "⚠️  WARNING: This will modify your Firestore database!\n" +
      "Only use in development/testing environments!",
  );

  // This is a placeholder - implement based on your actual needs
  console.log("Sample data generation not implemented in this version.");
  console.log(
    "Manually add documents or use Firebase Console to add test data.",
  );
};

/**
 * Analytics Data Validation
 * Checks if analytics calculations would work correctly
 */
export const validateAnalyticsReadiness = async (): Promise<{
  ready: boolean;
  score: number;
  recommendations: string[];
}> => {
  const recommendations: string[] = [];
  let score = 0;

  try {
    // Check invoices collection
    const invoicesRef = collection(db, "invoices");
    const invoicesSnap = await getDocs(query(invoicesRef, limit(100)));
    const invoices = invoicesSnap.docs.map((doc) => doc.data());

    if (invoices.length === 0) {
      recommendations.push(
        "❌ No invoices found. Analytics need data to work.",
      );
      score += 0;
    } else if (invoices.length < 10) {
      recommendations.push(
        "⚠  Low number of invoices. Analytics will work but with limited data.",
      );
      score += 50;
    } else {
      score += 100;
    }

    // Check invoice data quality
    const qualityIssues = invoices.filter(
      (inv: any) => !inv.invoiceDate || !inv.paidAmount || !inv.paymentMode,
    ).length;

    if (qualityIssues > 0) {
      recommendations.push(
        `⚠  ${qualityIssues} invoices missing required fields (invoiceDate, paidAmount, paymentMode)`,
      );
      score -= 20;
    }

    // Check visits collection
    const visitsRef = collection(db, "visits");
    const visitsSnap = await getDocs(query(visitsRef, limit(100)));
    if (visitsSnap.size === 0) {
      recommendations.push("⚠  No visits data found.");
    } else {
      score += 20;
    }

    // Check customers collection
    const customersRef = collection(db, "customers");
    const customersSnap = await getDocs(query(customersRef, limit(100)));
    if (customersSnap.size === 0) {
      recommendations.push("⚠  No customers data found.");
    } else {
      score += 20;
    }

    // Check services collection
    const servicesRef = collection(db, "services");
    const servicesSnap = await getDocs(query(servicesRef, limit(100)));
    if (servicesSnap.size === 0) {
      recommendations.push("⚠  No services data found.");
    } else {
      score += 20;
    }

    // Check staff collection
    const staffRef = collection(db, "staff");
    const staffSnap = await getDocs(query(staffRef, limit(100)));
    if (staffSnap.size === 0) {
      recommendations.push("⚠  No staff data found.");
    } else {
      score += 20;
    }

    const ready = score >= 70;

    if (ready) {
      recommendations.push(
        "✓ System ready for analytics! All essential data is present.",
      );
    }

    return {
      ready,
      score: Math.min(score, 100),
      recommendations,
    };
  } catch (error) {
    return {
      ready: false,
      score: 0,
      recommendations: [`❌ Error during validation: ${error}`],
    };
  }
};

/**
 * Export verification report as string
 */
export const exportReport = async (): Promise<void> => {
  try {
    const report = await generateStructureReport();
    const validation = await validateAnalyticsReadiness();

    const fullReport =
      report +
      "\n\nAnalytics Readiness:\n" +
      "--------------------\n" +
      `Ready: ${validation.ready ? "✓ Yes" : "✗ No"}\n` +
      `Score: ${validation.score}/100\n` +
      `Recommendations:\n${validation.recommendations.map((r) => `  ${r}`).join("\n")}`;

    console.log(fullReport);

    // You can also store this report somewhere
    return;
  } catch (error) {
    console.error("Error generating report:", error);
  }
};

// Run verification
export const runFullVerification = async () => {
  console.clear();
  console.log("🚀 Starting Complete Firestore Verification...\n");

  try {
    await exportReport();
  } catch (error) {
    console.error("Verification failed:", error);
  }
};

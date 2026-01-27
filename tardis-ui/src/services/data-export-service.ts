/**
 * Data Export Service
 * Provides functionality to export data in various formats (CSV, JSON, PDF)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface ExportOptions {
  filename?: string;
  dateFormat?: string;
  includeHeaders?: boolean;
  includeTimestamp?: boolean;
}

export interface TableData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  title?: string;
}

export interface AnalyticsExportData {
  title: string;
  dateRange?: { start: Date; end: Date };
  metrics: {
    label: string;
    value: string | number;
  }[];
  tables?: TableData[];
  notes?: string;
}

class DataExportService {
  private defaultOptions: ExportOptions = {
    filename: 'export',
    dateFormat: 'yyyy-MM-dd_HH-mm-ss',
    includeHeaders: true,
    includeTimestamp: true,
  };

  /**
   * Generate a timestamped filename
   */
  private generateFilename(baseName: string, extension: string): string {
    const timestamp = format(new Date(), this.defaultOptions.dateFormat!);
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Export data as CSV
   */
  exportToCSV(data: TableData | AnalyticsExportData, options: ExportOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };
    const content = this.buildCSVContent(data, opts);
    const filename = this.generateFilename(opts.filename || 'export', 'csv');
    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Build CSV content from data
   */
  private buildCSVContent(data: TableData | AnalyticsExportData, opts: ExportOptions): string {
    const lines: string[] = [];

    // Add title if present
    if ('title' in data && data.title) {
      lines.push(`# ${data.title}`);
      lines.push(''); // Empty line after title
    }

    // Add tables
    if ('tables' in data && data.tables) {
      for (const table of data.tables) {
        lines.push(`## ${table.title || 'Data'}`);
        lines.push(this.buildCSVTable(table));
        lines.push(''); // Empty line between tables
      }
    } else if ('headers' in data) {
      lines.push(this.buildCSVTable(data));
    }

    // Add notes if present
    if ('notes' in data && data.notes) {
      lines.push('');
      lines.push(`# Notes`);
      lines.push(data.notes);
    }

    // Add timestamp
    if (opts.includeTimestamp) {
      lines.push('');
      lines.push(`# Generated at: ${new Date().toISOString()}`);
    }

    return lines.join('\n');
  }

  /**
   * Build CSV table content
   */
  private buildCSVTable(table: TableData): string {
    const lines: string[] = [];

    // Headers
    if (table.headers.length > 0) {
      lines.push(table.headers.map(this.escapeCSVValue).join(','));
    }

    // Rows
    for (const row of table.rows) {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) {
          return '';
        }
        return this.escapeCSVValue(String(cell));
      });
      lines.push(csvRow.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Escape a value for CSV
   */
  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Export data as JSON
   */
  exportToJSON(data: any, options: ExportOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };
    const exportObj: any = {
      data,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    if (opts.includeTimestamp) {
      exportObj.metadata.generatedAt = new Date().toISOString();
    }

    const jsonContent = JSON.stringify(exportObj, null, 2);
    const filename = this.generateFilename(opts.filename || 'export', 'json');
    this.downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Export analytics data as PDF
   */
  exportToPDF(data: AnalyticsExportData, options: ExportOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title || 'Analytics Report', 20, yPosition);
    yPosition += 10;

    // Date range
    if (data.dateRange) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateText = `Period: ${format(data.dateRange.start, 'MMM d, yyyy')} - ${format(data.dateRange.end, 'MMM d, yyyy')}`;
      doc.text(dateText, 20, yPosition);
      yPosition += 10;
    }

    // Timestamp
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Metrics
    if (data.metrics.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Metrics', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      for (const metric of data.metrics) {
        doc.text(`${metric.label}: ${metric.value}`, 25, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    }

    // Tables
    if (data.tables && data.tables.length > 0) {
      for (const table of data.tables) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(table.title || 'Data', 20, yPosition);
        yPosition += 5;

        (doc as jsPDF).autoTable({
          startY: yPosition,
          head: [table.headers],
          body: table.rows,
          theme: 'striped',
          headStyles: { fillColor: [66, 135, 245] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 },
        });

        yPosition = (doc as jsPDF).lastAutoTable.finalY + 10;
      }
    }

    // Notes
    if (data.notes) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 20, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(data.notes, 170);
      doc.text(splitNotes, 20, yPosition);
    }

    const filename = this.generateFilename(opts.filename || 'export', 'pdf');
    doc.save(filename);
  }

  /**
   * Export learning progress report
   */
  exportLearningProgress(progressData: {
    studentName: string;
    courseName: string;
    completionPercentage: number;
    totalTimeSpent: number;
    quizScores: { quizName: string; score: number; date: Date }[];
    achievements: { name: string; earnedAt: Date }[];
    strengths: string[];
    areasForImprovement: string[];
  }, options: ExportOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };

    const metrics = [
      { label: 'Student', value: progressData.studentName },
      { label: 'Course', value: progressData.courseName },
      { label: 'Completion', value: `${progressData.completionPercentage}%` },
      { label: 'Total Time', value: `${Math.round(progressData.totalTimeSpent / 60)} minutes` },
    ];

    const quizTable: TableData = {
      title: 'Quiz Performance',
      headers: ['Quiz Name', 'Score (%)', 'Date'],
      rows: progressData.quizScores.map(q => [
        q.quizName,
        q.score.toString(),
        format(q.date, 'MMM d, yyyy'),
      ]),
    };

    const achievementsTable: TableData = {
      title: 'Achievements',
      headers: ['Achievement', 'Date Earned'],
      rows: progressData.achievements.map(a => [
        a.name,
        format(a.earnedAt, 'MMM d, yyyy'),
      ]),
    };

    const notes = `Strengths: ${progressData.strengths.join(', ')}\n\nAreas for Improvement: ${progressData.areasForImprovement.join(', ')}`;

    const exportData: AnalyticsExportData = {
      title: `Learning Progress Report - ${progressData.studentName}`,
      metrics,
      tables: [quizTable, achievementsTable],
      notes,
    };

    // Export in all formats
    this.exportToJSON(exportData, { ...opts, filename: `learning-progress-${progressData.studentName.toLowerCase().replace(/\s+/g, '-')}` });
    this.exportToPDF(exportData, { ...opts, filename: `learning-progress-${progressData.studentName.toLowerCase().replace(/\s+/g, '-')}` });
  }

  /**
   * Export course analytics
   */
  exportCourseAnalytics(analyticsData: {
    courseName: string;
    totalStudents: number;
    averageCompletion: number;
    averageScore: number;
    engagementRate: number;
    topPerformers: { name: string; score: number; completion: number }[];
    contentPerformance: { contentName: string; views: number; avgTime: number; completionRate: number }[];
    dateRange: { start: Date; end: Date };
  }, options: ExportOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };

    const metrics = [
      { label: 'Course', value: analyticsData.courseName },
      { label: 'Total Students', value: analyticsData.totalStudents.toString() },
      { label: 'Avg Completion', value: `${analyticsData.averageCompletion}%` },
      { label: 'Avg Score', value: `${analyticsData.averageScore}%` },
      { label: 'Engagement Rate', value: `${analyticsData.engagementRate}%` },
    ];

    const topPerformersTable: TableData = {
      title: 'Top Performers',
      headers: ['Student Name', 'Score (%)', 'Completion (%)'],
      rows: analyticsData.topPerformers.map(p => [
        p.name,
        p.score.toString(),
        p.completion.toString(),
      ]),
    };

    const contentTable: TableData = {
      title: 'Content Performance',
      headers: ['Content Name', 'Views', 'Avg Time (min)', 'Completion (%)'],
      rows: analyticsData.contentPerformance.map(c => [
        c.contentName,
        c.views.toString(),
        c.avgTime.toString(),
        c.completionRate.toString(),
      ]),
    };

    const exportData: AnalyticsExportData = {
      title: `Course Analytics - ${analyticsData.courseName}`,
      dateRange: analyticsData.dateRange,
      metrics,
      tables: [topPerformersTable, contentTable],
    };

    this.exportToJSON(exportData, { ...opts, filename: `course-analytics-${analyticsData.courseName.toLowerCase().replace(/\s+/g, '-')}` });
    this.exportToPDF(exportData, { ...opts, filename: `course-analytics-${analyticsData.courseName.toLowerCase().replace(/\s+/g, '-')}` });
  }

  /**
   * Trigger file download
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;

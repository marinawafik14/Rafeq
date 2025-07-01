import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvAnalysis } from '../../../../Models/ai/cv-analysis';
import { AiStorageService } from '../../../../Services/ai/ai-storage.service';
import { RagService } from '../../../../Services/ai/rag.service';

@Component({
  selector: 'app-cv-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-analysis.component.html',
  styleUrl: './cv-analysis.component.css'
})
export class CvAnalysisComponent implements OnInit, OnChanges {
  @Input() conversationId = '';
  @Input() analysisData: CvAnalysis | null = null;

  // Component state
  analyses: CvAnalysis[] = [];
  selectedAnalysis: CvAnalysis | null = null;
  showComparison = false;
  documentStats: any = null;

  // Analysis categories for visualization
  analysisCategories = [
    { key: 'contact', label: 'Contact Information', icon: 'fas fa-address-card' },
    { key: 'summary', label: 'Professional Summary', icon: 'fas fa-user-tie' },
    { key: 'experience', label: 'Work Experience', icon: 'fas fa-briefcase' },
    { key: 'education', label: 'Education', icon: 'fas fa-graduation-cap' },
    { key: 'skills', label: 'Skills', icon: 'fas fa-cogs' },
    { key: 'format', label: 'Format & Layout', icon: 'fas fa-palette' },
    { key: 'ats', label: 'ATS Compatibility', icon: 'fas fa-robot' }
  ];

  constructor(
    private storageService: AiStorageService,
    private ragService: RagService
  ) {}

  ngOnInit(): void {
    this.loadAnalyses();
    this.loadDocumentStats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analysisData'] || changes['conversationId']) {
      this.loadAnalyses();
      if (this.analysisData) {
        this.selectedAnalysis = this.analysisData;
      }
    }
  }

  private loadAnalyses(): void {
    this.analyses = this.storageService.getCvAnalyses();
    if (this.conversationId) {
      this.analyses = this.analyses.filter(
        analysis => analysis.conversationId === this.conversationId
      );
    }
    
    if (this.analyses.length > 0 && !this.selectedAnalysis) {
      this.selectedAnalysis = this.analyses[0];
    }
  }

  private loadDocumentStats(): void {
    this.documentStats = this.ragService.getUserDocumentStats();
  }

  // Get overall score color
  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  // Get score label
  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  }

  // Get section score (mock implementation - in real app this would come from analysis)
  getSectionScore(sectionKey: string): number {
    if (!this.selectedAnalysis) return 0;
    
    // Mock scores based on section key
    const mockScores: {[key: string]: number} = {
      contact: 85,
      summary: 72,
      experience: 78,
      education: 80,
      skills: 65,
      format: 70,
      ats: 60
    };
    
    return mockScores[sectionKey] || 0;
  }

  // Get section feedback (mock implementation)
  getSectionFeedback(sectionKey: string): string {
    const mockFeedback: {[key: string]: string} = {
      contact: 'Contact information is complete and professional.',
      summary: 'Professional summary could be more impactful with specific achievements.',
      experience: 'Work experience shows good progression. Add more quantifiable results.',
      education: 'Education section is well-formatted and relevant.',
      skills: 'Skills section needs more technical keywords for your industry.',
      format: 'Layout is clean but could benefit from better use of white space.',
      ats: 'Some formatting may not be ATS-friendly. Consider simpler layouts.'
    };
    
    return mockFeedback[sectionKey] || 'No specific feedback available.';
  }

  // Toggle analysis comparison
  toggleComparison(): void {
    this.showComparison = !this.showComparison;
  }

  // Select analysis for viewing
  selectAnalysis(analysis: CvAnalysis): void {
    this.selectedAnalysis = analysis;
  }

  // Get improvement suggestions
  get improvementSuggestions(): string[] {
    if (!this.selectedAnalysis) return [];
    
    return [
      'Add quantifiable achievements to work experience',
      'Include more industry-specific keywords',
      'Improve ATS compatibility by simplifying formatting',
      'Strengthen professional summary with specific metrics',
      'Add relevant certifications or training',
      'Optimize section headers for better scanning'
    ];
  }

  // Get strengths
  get strengths(): string[] {
    if (!this.selectedAnalysis) return [];
    
    return [
      'Clear contact information and professional presentation',
      'Good educational background relevant to target roles',
      'Consistent work history with career progression',
      'Clean and readable format',
      'Appropriate length for experience level'
    ];
  }

  // Get priority actions
  get priorityActions(): Array<{text: string, priority: 'high' | 'medium' | 'low'}> {
    return [
      { text: 'Add metrics to work achievements', priority: 'high' },
      { text: 'Include relevant keywords', priority: 'high' },
      { text: 'Optimize for ATS systems', priority: 'medium' },
      { text: 'Enhance professional summary', priority: 'medium' },
      { text: 'Add professional certifications', priority: 'low' },
      { text: 'Consider adding volunteer work', priority: 'low' }
    ];
  }

  // Get analysis progress percentage
  getAnalysisProgress(): number {
    if (!this.selectedAnalysis) return 0;
    return Math.round((this.selectedAnalysis.analysis.overallScore / 100) * 100);
  }

  // Format analysis date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check if analysis is recent
  isRecentAnalysis(date: Date): boolean {
    const now = new Date();
    const analysisDate = new Date(date);
    const diffInHours = (now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  // Get comparison data for multiple analyses
  getComparisonData(): any[] {
    if (!this.selectedAnalysis) return [];
    
    // Mock comparison data
    return this.analyses.map(analysis => ({
      label: this.formatDate(analysis.createdAt),
      score: analysis.analysis.overallScore,
      date: analysis.createdAt,
      improvements: analysis.analysis.overallScore - this.selectedAnalysis.analysis.overallScore
    }));
  }

  // Download analysis report (mock implementation)
  downloadReport(): void {
    if (!this.selectedAnalysis) return;
    
    const reportData = `CV Analysis Report\n\n` +
                       `Overall Score: ${this.selectedAnalysis.analysis.overallScore}\n` +
                       `Date: ${this.formatDate(this.selectedAnalysis.createdAt)}\n\n` +
                       `Section Scores:\n` +
                       this.analysisCategories.map(category => 
                         `${category.label}: ${this.getSectionScore(category.key)}/100`
                       ).join('\n') +
                       `\n\nStrengths:\n` +
                       this.strengths.join('\n') +
                       `\n\nImprovements:\n` +
                       this.improvementSuggestions.join('\n');
    
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_Analysis_Report_${this.selectedAnalysis.conversationId}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Share analysis results (mock implementation)
  shareAnalysis(): void {
    if (!this.selectedAnalysis) return;
    
    const shareData = {
      title: 'CV Analysis Results',
      text: `Check out my CV analysis results! Overall Score: ${this.selectedAnalysis.analysis.overallScore}`,
      url: window.location.href
    };
    
    navigator.share(shareData)
      .then(() => console.log('Share successful'))
      .catch(err => console.error('Share failed', err));
  }
}

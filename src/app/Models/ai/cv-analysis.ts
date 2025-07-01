export interface CvAnalysis {
  id: string;
  conversationId: string;
  fileId: string;
  analysis: {
    overallScore: number; // 1-100
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    sections: {
      [key: string]: {
        score: number;
        feedback: string;
      };
    };
  };
  createdAt: Date;
}

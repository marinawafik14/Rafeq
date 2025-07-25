import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { OpenaiRequest, EmbeddingRequest } from '../../Models/ai/openai-request';
import { OpenaiResponse, EmbeddingResponse } from '../../Models/ai/openai-response';

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private openaiHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${environment.openai.apiKey}`
  });

  constructor(private http: HttpClient) {}

 
  sendChatMessage(messages: any[], systemPrompt?: string): Observable<string> {
    const requestBody: OpenaiRequest = {
      model: environment.openai.chatModel,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages
      ],
      max_tokens: 2000,
      temperature: 0.7
    };

   
    const context = new HttpContext().set('skipAuth' as any, true);

    return this.http.post<OpenaiResponse>(
      environment.openai.chatApiUrl,
      requestBody,
      { 
        headers: this.openaiHeaders,
        context: context
      }
    ).pipe(
      map(response => response.choices[0]?.message?.content || 'No response received'),
      catchError(this.handleError)
    );
  }

  
  analyzeCVContent(cvText: string): Observable<string> {
    const systemPrompt = `You are an expert career advisor and CV reviewer. Analyze the provided CV and provide detailed feedback including:
    1. Overall score (1-100)
    2. Strengths and areas for improvement
    3. Specific suggestions for each section
    4. ATS optimization tips
    5. Industry-specific recommendations
    
    Format your response in a clear, structured manner with actionable advice.`;

    const userMessage = `Please analyze this CV and provide comprehensive feedback:\n\n${cvText}`;

    return this.sendChatMessage([
      { role: 'user', content: userMessage }
    ], systemPrompt);
  }

  
  analyzeImage(imageBase64: string, prompt: string = "Analyze this image"): Observable<string> {
    const requestBody = {
      model: 'gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` } 
          }
        ]
      }],
      max_tokens: 1000
    };

    const context = new HttpContext().set('skipAuth' as any, true);

    return this.http.post<OpenaiResponse>(
      environment.openai.chatApiUrl,
      requestBody,
      { 
        headers: this.openaiHeaders,
        context: context
      }
    ).pipe(
      map(response => response.choices[0]?.message?.content || 'No response received'),
      catchError(this.handleError)
    );
  }

  
  generateEmbedding(text: string): Observable<number[]> {
    const requestBody: EmbeddingRequest = {
      model: environment.openai.embeddingModel,
      input: text
    };

    const context = new HttpContext().set('skipAuth' as any, true);

    return this.http.post<EmbeddingResponse>(
      environment.openai.embeddingApiUrl,
      requestBody,
      { 
        headers: this.openaiHeaders,
        context: context
      }
    ).pipe(
      map(response => response.data[0]?.embedding || []),
      catchError(this.handleError)
    );
  }

  
  getCareerAdvice(userQuestion: string, userContext?: any): Observable<string> {
    const systemPrompt = `You are a professional career advisor specializing in the Egyptian and Middle Eastern job market. 
    Provide helpful, actionable career advice. Be encouraging and specific in your recommendations.
    Consider local market conditions, cultural context, and industry trends in Egypt and the region.`;

    const contextInfo = userContext ? 
      `User Context: ${JSON.stringify(userContext)}\n\n` : '';

    return this.sendChatMessage([
      { role: 'user', content: `${contextInfo}${userQuestion}` }
    ], systemPrompt);
  }

  
  generateInterviewQuestions(jobTitle: string, industry: string): Observable<string> {
    const systemPrompt = `You are an expert interview coach. Generate realistic interview questions for the Egyptian job market.
    Provide both technical and behavioral questions with tips for strong answers.`;

    const userMessage = `Generate interview questions for a ${jobTitle} position in the ${industry} industry. 
    Include 5 technical questions and 5 behavioral questions with guidance on how to answer them effectively.`;

    return this.sendChatMessage([
      { role: 'user', content: userMessage }
    ], systemPrompt);
  }

  private handleError(error: any): Observable<never> {
    console.error('OpenAI API Error:', error);
    let errorMessage = 'An error occurred while communicating with AI service';
    
    if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

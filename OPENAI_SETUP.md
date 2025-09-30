# OpenAI Integration Setup Guide

##  Quick Start

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the API key (starts with `sk-`)

### 2. Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp api/env.example api/.env
   ```

2. Edit `api/.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Test the Integration
Run the test script to verify everything works:
```bash
node test-openai.js
```

## 🔧 How It Works

### Automatic Fallback
- **With API Key**: Uses OpenAI GPT-4o-mini for intelligent resume grading
- **Without API Key**: Falls back to mock grading (current behavior)
- **API Errors**: Automatically falls back to mock grading if OpenAI fails

### Grading Process
1. **Job Description Analysis**: Extracts requirements, skills, experience level
2. **Resume Analysis**: Extracts candidate skills, experience, education
3. **AI Comparison**: GPT-4o-mini compares and scores the match
4. **Detailed Feedback**: Provides 3 specific reasons for the score

### Cost Optimization
- Uses **GPT-4o-mini** (cheaper than GPT-4)
- **Temperature 0.3** for consistent scoring
- **Max 1000 tokens** per request
- **Automatic fallback** prevents API failures

## 📊 Example Output

```
Using OpenAI for grading resume: doc_12345
✅ OpenAI Integration Test Results:
📊 Score: 87/100
📝 Reasons:
   1. Strong technical skills match: JavaScript, React, Node.js align with requirements
   2. 6+ years of experience exceeds the 5+ year senior requirement
   3. Bachelor's degree in Computer Science meets educational requirements
```

## 🛠️ Customization

### Modify the Prompt
Edit `api/src/services/llmService.ts` in the `createGradingPrompt` function to:
- Change scoring criteria
- Add company-specific requirements
- Modify the response format
- Adjust the grading instructions

### Change the Model
In `llmService.ts`, change the model:
```typescript
model: "gpt-4o-mini", // Current: cost-effective
model: "gpt-4o",      // Alternative: more capable but expensive
```

### Adjust Scoring
Modify the prompt instructions to:
- Weight different criteria differently
- Add specific industry requirements
- Include cultural fit assessments

## 🔍 Troubleshooting

### Common Issues

1. **"No response from OpenAI"**
   - Check your API key is correct
   - Verify you have credits in your OpenAI account
   - Check internet connection

2. **"Invalid response structure"**
   - The AI response wasn't in expected JSON format
   - System automatically falls back to mock grading

3. **High API costs**
   - Switch to GPT-4o-mini (already configured)
   - Reduce max_tokens if needed
   - Add more specific prompts to get better results

### Debug Mode
Add this to see detailed logs:
```typescript
console.log('OpenAI Response:', content);
```

## 📈 Monitoring

The system logs:
- When OpenAI is used vs mock grading
- API call success/failure
- Fallback activations
- Grading completion

Check your terminal/console for these messages during job processing.

## 🎯 Next Steps

1. **Set up your API key** following the steps above
2. **Test with a real job** by clicking "Start" on any job card
3. **Monitor the results** in the rankings view
4. **Customize the prompts** based on your specific needs

The integration is now ready to provide intelligent, AI-powered resume grading! 🎉

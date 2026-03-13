import * as fs from 'fs';
import * as path from 'path';

const CONVERSATIONS_DIR = 'conversations';

const DEFAULT_FALLBACK = `Patient (Amira, 34):
Doctor, I wanted to come in because I've been feeling more tired than usual lately. I don't know if it's just stress from work or something more.

Doctor (Dr. Shah):
I'm glad you came in, Amira. Fatigue can have many causes, and it's important we take a closer look. Tell me—how has your sleep been? Are you getting restful nights?

Patient:
Honestly, not really. I fall asleep late, and even when I get 7 hours, I wake up groggy. My periods have also been heavier the past few months, which feels unusual for me.

Doctor:
Thank you for sharing that. Changes in your menstrual cycle and fatigue can sometimes be linked—iron deficiency, for example, can cause both. Have you noticed dizziness, shortness of breath, or headaches?

Patient:
Yes, I do get headaches, especially around my cycle, and I've been more lightheaded than usual when I stand up quickly.

Doctor:
That's helpful to know. We'll run some simple blood tests to check your iron levels, thyroid function, and vitamin D. These are common contributors to fatigue in women your age. In the meantime, tell me about your diet—are you eating enough iron-rich foods like leafy greens, beans, or lean meats?

Patient:
I'm vegetarian, so I mostly rely on beans, lentils, and spinach. But I probably don't get enough variety.

Doctor:
That makes sense. A vegetarian diet can be very healthy, but sometimes supplementation is needed, especially for iron and B12. Depending on your test results, we may recommend supplements.

Also, since you mentioned stress, let's not forget lifestyle factors—hydration, exercise, and mindfulness can all help improve energy levels. Do you do anything for stress relief?

Patient:
I used to do yoga but fell out of the habit. I've been meaning to start again.

Doctor:
That would be a great idea. Even 15 minutes a day can help both stress and sleep quality. Let's check your labs first, and then we'll create a wellness plan that covers nutrition, movement, and stress management.

Is there anything else you're concerned about today?

Patient:
No, that covers it. I just wanted to make sure it's not something serious.

Doctor:
That's completely understandable. You've done the right thing by checking in early. Most often, these are manageable with a few adjustments, but we'll confirm with your test results. You'll hear from us within a few days.`;

function listTextFiles(dir: string): string[] {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
    return fs.readdirSync(dir)
        .filter(f => f.toLowerCase().endsWith('.txt'))
        .sort()
        .map(f => path.join(dir, f));
}

export function loadRandomConversation(): string {
    const overrideDir = (process.env.CONVERSATION_DIR || '').trim();
    let candidates: string[] = [];

    if (overrideDir) {
        candidates = listTextFiles(overrideDir);
    }

    if (candidates.length === 0) {
        const defaultDir = path.resolve(process.cwd(), CONVERSATIONS_DIR);
        candidates = listTextFiles(defaultDir);
    }

    if (candidates.length === 0) {
        console.log('No conversation files found. Using fallback text.');
        return DEFAULT_FALLBACK;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    console.log(`Selected conversation file: ${path.basename(chosen)}`);
    return fs.readFileSync(chosen, 'utf-8');
}

export function loadAllConversations(): string[] {
    const defaultDir = path.resolve(process.cwd(), CONVERSATIONS_DIR);
    const candidates = listTextFiles(defaultDir);
    if (candidates.length === 0) return [DEFAULT_FALLBACK];
    return candidates.map(f => fs.readFileSync(f, 'utf-8'));
}

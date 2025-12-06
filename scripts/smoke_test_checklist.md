# MVP Smoke Test Checklist

**Date:** _______________  
**Tester:** _______________  
**Environment:** Production / Staging

---

## Test 1: Quick Start Onboarding
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 1.1 | Open app as new user | LandingScreen shows | [ ] |
| 1.2 | Click "Quick Start" | Navigate to Stream | [ ] |
| 1.3 | Type 10+ character entry | Entry saved, AI enriches | [ ] |
| 1.4 | Wait 2-3 seconds | InsightModal appears | [ ] |
| 1.5 | Modal has insight text | Non-generic insight | [ ] |
| 1.6 | Click "Track Habit" | Habit created, nav to Focus | [ ] |
| 1.7 | Check analytics | `first_action_taken` logged | [ ] |

**Notes:** 
_______________________________________________

---

## Test 2: Guided Setup Onboarding
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 2.1 | Open app as new user | LandingScreen shows | [ ] |
| 2.2 | Click "Guided Setup" | OnboardingWizard starts | [ ] |
| 2.3 | Complete all steps | Reaches Stream | [ ] |
| 2.4 | Entry auto-created | From wizard input | [ ] |

**Notes:**
_______________________________________________

---

## Test 3: Habit Toggle & Streak
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 3.1 | Go to Focus > Habits | Habit list shows | [ ] |
| 3.2 | Tap empty dot | Dot fills (optimistic) | [ ] |
| 3.3 | Refresh page | Dot still filled (synced) | [ ] |
| 3.4 | Check streak count | Updates correctly | [ ] |
| 3.5 | New habit shows only current dots | Based on creation date | [ ] |

**Notes:**
_______________________________________________

---

## Test 4: Insights Unlock (5 Entries)
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 4.1 | User has < 5 entries | Insights tab hidden | [ ] |
| 4.2 | Create 5th entry | Toast: "Insights unlocked!" | [ ] |
| 4.3 | NavBar updates | Insights tab appears + badge | [ ] |
| 4.4 | Click Insights | First visit, badge clears | [ ] |
| 4.5 | Check analytics | `insights_unlocked` logged | [ ] |

**Notes:**
_______________________________________________

---

## Test 5: Voice Input (Chrome Desktop)
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 5.1 | Click mic button | Browser asks for permission | [ ] |
| 5.2 | Grant permission | "Listening..." placeholder | [ ] |
| 5.3 | Speak clearly | Text appears in input | [ ] |
| 5.4 | Submit | Entry created with content | [ ] |

**Notes:**
_______________________________________________

---

## Test 6: Voice Input (iOS Safari)
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 6.1 | Open app in Safari iOS | App loads | [ ] |
| 6.2 | Tap mic button | Permission dialog | [ ] |
| 6.3 | Allow microphone | Listening starts | [ ] |
| 6.4 | Speak | Text transcribed | [ ] |
| 6.5 | Submit | Entry saved | [ ] |

**Notes:**
_______________________________________________

---

## Test 7: Voice Error Handling
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 7.1 | Deny mic permission | Toast: "Microphone access denied" | [ ] |
| 7.2 | Click mic, say nothing | Toast: "No speech detected" | [ ] |
| 7.3 | Use unsupported browser | Toast: "Voice not supported" | [ ] |

**Notes:**
_______________________________________________

---

## Test 8: Reflections
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 8.1 | Go to Insights > Reflections | View shows | [ ] |
| 8.2 | Click Generate Daily | Reflection generates | [ ] |
| 8.3 | Summary is 3-5 sentences | Not too short/long | [ ] |
| 8.4 | Suggestion (if any) is specific | References actual data | [ ] |
| 8.5 | Check analytics | `reflection_generated` logged | [ ] |

**Notes:**
_______________________________________________

---

## Test 9: Edit Functionality
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 9.1 | Tap entry > Edit | EditEntryModal opens | [ ] |
| 9.2 | Change text > Save | Entry updated | [ ] |
| 9.3 | Expand habit > Edit | EditHabitModal opens | [ ] |
| 9.4 | Change name > Save | Habit updated | [ ] |
| 9.5 | Tap intention pencil | EditIntentionModal opens | [ ] |
| 9.6 | Change text > Save | Intention updated | [ ] |

**Notes:**
_______________________________________________

---

## Test 10: Error Monitoring (Sentry)
| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 10.1 | Cause an error (if possible) | App shows error boundary | [ ] |
| 10.2 | Check Sentry dashboard | Error captured | [ ] |
| 10.3 | Stack trace available | Readable trace | [ ] |

**Notes:**
_______________________________________________

---

## Summary

| Test | Status |
|------|--------|
| 1. Quick Start | [ ] Pass [ ] Fail |
| 2. Guided Setup | [ ] Pass [ ] Fail |
| 3. Habit Toggle | [ ] Pass [ ] Fail |
| 4. Insights Unlock | [ ] Pass [ ] Fail |
| 5. Voice (Chrome) | [ ] Pass [ ] Fail |
| 6. Voice (iOS Safari) | [ ] Pass [ ] Fail |
| 7. Voice Errors | [ ] Pass [ ] Fail |
| 8. Reflections | [ ] Pass [ ] Fail |
| 9. Edit Functions | [ ] Pass [ ] Fail |
| 10. Sentry | [ ] Pass [ ] Fail |

**Overall:** [ ] READY FOR LAUNCH  [ ] NEEDS FIXES

**Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

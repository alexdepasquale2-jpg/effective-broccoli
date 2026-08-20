import { pressureFor } from "./resources.js";

// A thread is a story that runs whether or not you are in it.
// Each beat calls for one of: pass (leave it), tend (be present), act (intervene).
// Endings are chosen by accumulated pressure. rank 0 is the best outcome.

export const REVEALS = {
  pass: "This is already resolving. It does not need you.",
  tend: "This needs presence, not repair. Be near it; do not fix it.",
  act: "This one actually needs your hand, and needs it now.",
};

export const THREADS = [
  // ------------------------------------------------------------------ KIN
  {
    id: "quiet-brother",
    title: "The Quiet Brother",
    domain: "kin",
    loud: false,
    beats: [
      {
        text: "Your brother has stopped answering in the group chat. Not angrily. Just less, and then not at all.",
        window: 13,
        need: "tend",
        pass: { text: "You left the space open. He did not step into it." },
        tend: { label: "Send nothing important", text: "You sent him a photograph of the river. He sent back a single word. It was contact." },
        act: { label: "Demand he talk", text: "You asked what was wrong, three times, in escalating fonts. He went quieter." },
      },
      {
        text: "He shows up to dinner. He eats. He answers questions with the smallest true answer available.",
        window: 12,
        need: "tend",
        pass: { text: "You let him sit in it. He stayed to the end of the meal, which was more than last time." },
        tend: { label: "Sit beside him", text: "You took the chair next to his and talked about nothing for an hour. He stopped bracing." },
        act: { label: "Ask what's wrong", text: "He said 'nothing' with the flatness of a door closing." },
      },
      {
        text: "He mentions, sideways, that he has not left the flat in nine days.",
        window: 11,
        need: "act",
        pass: { text: "You let it pass, the way you let the others pass. Nine days became a month." },
        tend: { label: "Stay near", text: "You stayed close. Close was no longer the size of the problem." },
        act: { label: "Go to him now", text: "You drove out that night. He opened the door before you knocked, like he had been listening for a car." },
      },
    ],
    endings: [
      { at: -999, key: "kept", rank: 0, title: "He came back", text: "It took a season. He came back the way people do — slowly, and then all at once, at a table.", effects: { kin: 12, self: 4 } },
      { at: -4, key: "held", rank: 1, title: "He held on", text: "He is still quiet. He still answers. It is not resolved and it is not lost.", effects: { kin: 2 } },
      { at: 5, key: "lost", rank: 2, title: "He went under", text: "You heard about it from someone else, later, in the tone people use for things that were visible the whole time.", effects: { kin: -16, self: -8 } },
    ],
  },
  {
    id: "inheritance",
    title: "The House Nobody Wants",
    domain: "kin",
    loud: true,
    beats: [
      {
        text: "The family is arguing about your grandmother's house. There are seven opinions and four people.",
        window: 10,
        need: "pass",
        pass: { text: "You did not add an eighth opinion." },
        tend: { label: "Hear everyone out", text: "You listened to all of it. You were then quoted, inaccurately, by three parties." },
        act: { label: "Propose the solution", text: "You proposed the obvious solution. It became your solution, and therefore something to defeat." },
      },
      {
        text: "Someone forwards you a long message with the word 'FINAL' in the subject line.",
        window: 9,
        need: "pass",
        pass: { text: "You read it. You did not reply. It was not final." },
        tend: { label: "Reply warmly", text: "Your warm reply was read as taking a side. You had not taken a side." },
        act: { label: "Settle it", text: "You settled it. It unsettled twice more, and both times with your name on it." },
      },
      {
        text: "A solicitor's date is set. Everyone is suddenly, exhaustedly reasonable.",
        window: 9,
        need: "pass",
        pass: { text: "The deadline did what eleven months of family discussion could not." },
        tend: { label: "Check on everyone", text: "You checked on everyone. Everyone was fine. They had been fine for a week." },
        act: { label: "Renegotiate", text: "You reopened it four days before the date. The date moved. Twice." },
      },
    ],
    endings: [
      { at: -999, key: "sold", rank: 0, title: "It sold in spring", text: "The house sold. Nobody was thrilled. Nobody stopped speaking. That is what a good outcome looks like here.", effects: { kin: 8 } },
      { at: -4, key: "dragged", rank: 1, title: "It dragged", text: "It took another year and one Christmas was strange, but it ended.", effects: { kin: -2 } },
      { at: 5, key: "feud", rank: 2, title: "Two branches, no bridge", text: "The house sold eventually. Two people did not come to the funeral after that one.", effects: { kin: -14 } },
    ],
  },
  {
    id: "diagnosis",
    title: "The Scan Result",
    domain: "kin",
    loud: false,
    beats: [
      {
        text: "Your mother mentions a scan she had. She mentions it the way you mention weather.",
        window: 12,
        need: "tend",
        pass: { text: "You let it go by. She had brought it up on purpose." },
        tend: { label: "Ask, gently", text: "You asked one more question than politeness required. She told you the rest." },
        act: { label: "Take over", text: "You began organising specialists before she had finished the sentence. She stopped finishing sentences." },
      },
      {
        text: "The appointment is Thursday. She says she is fine to go alone. She says it twice.",
        window: 11,
        need: "act",
        pass: { text: "She went alone. She said it was fine. She said it in the voice." },
        tend: { label: "Phone that evening", text: "You called after. She had already spent the day holding it by herself." },
        act: { label: "Be in the waiting room", text: "You were in the chair when she came out. She did not thank you. She held your sleeve in the corridor." },
      },
      {
        text: "It is treatable. There is now a calendar of appointments stretching into next year.",
        window: 12,
        need: "tend",
        pass: { text: "You let her manage it. She managed it, competently, alone." },
        tend: { label: "Show up on the ordinary days", text: "You came on the boring Tuesdays, not just the frightening ones. That turned out to be the whole thing." },
        act: { label: "Run the whole schedule", text: "You took over the calendar. She became a patient in her own life, and resented it quietly." },
      },
    ],
    endings: [
      { at: -999, key: "beside", rank: 0, title: "You were beside her", text: "The treatment worked. What she remembers is not the treatment.", effects: { kin: 14, self: 6 } },
      { at: -4, key: "managed", rank: 1, title: "It was managed", text: "She got through it. It was handled well and felt lonely.", effects: { kin: 2, self: -2 } },
      { at: 5, key: "alone", rank: 2, title: "She did it alone", text: "She got through it. She stopped mentioning things like weather after that.", effects: { kin: -13, self: -6 } },
    ],
  },

  // ----------------------------------------------------------------- WORK
  {
    id: "collapsing-project",
    title: "The Doomed Project",
    domain: "work",
    loud: true,
    beats: [
      {
        text: "The project is nine weeks behind and someone has started using the word 'runway' in meetings.",
        window: 10,
        need: "pass",
        pass: { text: "You did your part and let the rest be somebody else's weather." },
        tend: { label: "Reassure the team", text: "You reassured them. They believed you. That made the next part worse." },
        act: { label: "Rescue it", text: "You rebuilt the schedule over a weekend. The schedule was never the problem." },
      },
      {
        text: "A meeting is called to 'realign'. It is the fourth realignment.",
        window: 9,
        need: "pass",
        pass: { text: "You said little. Nothing was decided, which was the point of the meeting." },
        tend: { label: "Hold the room", text: "You held the room together for ninety minutes and it dissolved by Thursday anyway." },
        act: { label: "Take ownership", text: "You volunteered to own it. You now owned a thing that could not be owned." },
      },
      {
        text: "It is cancelled on a Tuesday, in two sentences, by email.",
        window: 9,
        need: "pass",
        pass: { text: "It was cancelled. You had spent nothing on it that you could not spare." },
        tend: { label: "Debrief the team", text: "You gathered everyone to process it. It was kind and it did not change the ledger." },
        act: { label: "Fight the decision", text: "You fought it. You lost, publicly, and were remembered as attached to a failure." },
      },
    ],
    endings: [
      { at: -999, key: "clean", rank: 0, title: "You walked out clean", text: "It died. You had kept your hands free, and the next thing came to you first.", effects: { work: 9, self: 5 } },
      { at: -4, key: "singed", rank: 1, title: "Singed", text: "It died and some of the smoke stayed on you for a quarter.", effects: { work: -3 } },
      { at: 5, key: "sunk", rank: 2, title: "You went down with it", text: "It died with your name on the hull. You spent a year explaining a thing that was never yours.", effects: { work: -15, self: -7 } },
    ],
  },
  {
    id: "apprentice",
    title: "The One Who Is Struggling",
    domain: "work",
    loud: false,
    beats: [
      {
        text: "The newest person on the team has stopped asking questions. Their work has not improved.",
        window: 12,
        need: "tend",
        pass: { text: "You let them find their feet. They found a way to look like they had." },
        tend: { label: "Work near them", text: "You sat and did your own work beside theirs for an afternoon. They started asking again." },
        act: { label: "Correct their work", text: "You fixed their output line by line. They learned that you would." },
      },
      {
        text: "They have been rewriting the same function for three days without telling anyone.",
        window: 11,
        need: "tend",
        pass: { text: "Three days became five. They got there. It cost them something they did not have to spend." },
        tend: { label: "Mention you got stuck once", text: "You told them about the week you lost to something similar. They exhaled and asked for help an hour later." },
        act: { label: "Just do it for them", text: "You did it in twenty minutes. They watched, and understood that they were slow." },
      },
      {
        text: "There is a review on Friday. Their name is on a list you have seen and they have not.",
        window: 11,
        need: "act",
        pass: { text: "You let the process be the process. They found out on Friday, in a room, with no warning." },
        tend: { label: "Be encouraging", text: "You were warm and vague. On Friday the warmth read as having known." },
        act: { label: "Warn them", text: "You told them what was coming. They walked into that room with something prepared, and kept the job." },
      },
    ],
    endings: [
      { at: -999, key: "grew", rank: 0, title: "They became good", text: "Two years on they are the one people sit beside. They do not remember why they work that way.", effects: { work: 12, town: 4 } },
      { at: -4, key: "stayed", rank: 1, title: "They stayed, roughly", text: "They are adequate and slightly guarded. It is fine. It could have been more.", effects: { work: 2 } },
      { at: 5, key: "left", rank: 2, title: "They left in March", text: "They were let go, or quit first — the paperwork disagreed. Either way the chair beside yours is empty.", effects: { work: -12, self: -4 } },
    ],
  },
  {
    id: "stolen-credit",
    title: "The Slide With Your Work On It",
    domain: "work",
    loud: true,
    beats: [
      {
        text: "Someone presented your analysis. They did not say your name. Twice they said 'I'.",
        window: 10,
        need: "pass",
        pass: { text: "You said nothing in the room. Two people noticed anyway; they always do." },
        tend: { label: "Speak to them after", text: "You raised it privately. They apologised in a way that made it your sensitivity." },
        act: { label: "Correct it in the room", text: "You corrected the record live. You were right, and the room remembered the temperature, not the fact." },
      },
      {
        text: "The work is being praised in a channel you are not in.",
        window: 9,
        need: "pass",
        pass: { text: "You let the praise land where it landed. Your director asked you about the methodology directly, later." },
        tend: { label: "Add context", text: "You added a helpful clarifying comment. It read as a flag planted." },
        act: { label: "Set the record straight", text: "You posted the timeline with receipts. Everyone agreed with you and nobody enjoyed it." },
      },
      {
        text: "They ask you to collaborate again, apparently sincerely.",
        window: 11,
        need: "tend",
        pass: { text: "You declined by not replying. It cost you a door you did not know was a door." },
        tend: { label: "Say yes, with terms", text: "You said yes and put your name in the file where it could not be edited out. They agreed easily." },
        act: { label: "Refuse and say why", text: "You refused, at length. It was justified and it closed a room you later needed." },
      },
    ],
    endings: [
      { at: -999, key: "known", rank: 0, title: "The right people knew", text: "Credit is slower than theft and it arrives anyway. It arrived.", effects: { work: 10, self: 3 } },
      { at: -4, key: "even", rank: 1, title: "Roughly even", text: "You got some of it back. It took energy you would rather have spent making the next thing.", effects: { work: -1 } },
      { at: 5, key: "difficult", rank: 2, title: "You became 'difficult'", text: "You were entirely in the right and are now a person other people manage carefully.", effects: { work: -13, town: -3 } },
    ],
  },

  // ----------------------------------------------------------------- TOWN
  {
    id: "river-rises",
    title: "The River",
    domain: "town",
    loud: true,
    beats: [
      {
        text: "The river is high and brown and everyone in the valley is talking about it. They talk about it every spring.",
        window: 10,
        need: "pass",
        pass: { text: "It was high. It is high most springs. It went down two feet overnight." },
        tend: { label: "Check on the low houses", text: "You walked the low road. Everything was where it should be. It cost you an evening." },
        act: { label: "Start sandbagging", text: "You spent a day sandbagging against a flood that did not come. Your back remembered it for a week." },
      },
      {
        text: "It rains for thirty hours without stopping. The gauge by the bridge is under water, so nobody knows the number.",
        window: 10,
        need: "act",
        pass: { text: "You let the valley handle it. The valley was asleep." },
        tend: { label: "Wake the neighbours", text: "You woke them. Waking them was not the same as moving anything, and the water did not wait." },
        act: { label: "Move the Hallorans' livestock", text: "You and four others got the animals to the top field at three in the morning. By six the bottom field was a lake." },
      },
      {
        text: "The water is in the lane. There are people on the bridge deciding things badly and loudly.",
        window: 10,
        need: "act",
        pass: { text: "You stayed out of it. The loud people on the bridge made the decisions." },
        tend: { label: "Bring tea and blankets", text: "You brought what comfort you could to people standing in water. It was kind and it was not what the hour needed." },
        act: { label: "Open the old sluice", text: "You waded to the sluice your grandfather maintained and hauled it open. The lane dropped four inches in an hour." },
      },
    ],
    endings: [
      { at: -999, key: "held", rank: 0, title: "The valley held", text: "Three houses took water in the cellar. Nothing else. In this valley that counts as a miracle, and nobody calls it one.", effects: { town: 14, kin: 4 } },
      { at: -4, key: "damage", rank: 1, title: "Costly", text: "Six houses flooded to the sills. It was survivable and it took two years to be over.", effects: { town: -5 } },
      { at: 5, key: "lost", rank: 2, title: "The low road went", text: "The bottom of the valley was under a metre of water for nine days. Some of it was never rebuilt.", effects: { town: -18, kin: -5, self: -5 } },
    ],
  },
  {
    id: "feud",
    title: "The Boundary Hedge",
    domain: "town",
    loud: true,
    beats: [
      {
        text: "Two neighbours are at war over sixty centimetres of hedge. Both have shown you a map.",
        window: 9,
        need: "pass",
        pass: { text: "You looked at the map and made a sound that committed you to nothing." },
        tend: { label: "Sympathise with both", text: "You sympathised with both. Both reported that you agreed with them, and then met." },
        act: { label: "Adjudicate", text: "You gave your honest reading of the boundary. You made a permanent enemy and a temporary ally." },
      },
      {
        text: "One of them has begun photographing the hedge daily. There is a folder.",
        window: 9,
        need: "pass",
        pass: { text: "The folder grew. Folders like that are how a person survives a thing without doing anything about it." },
        tend: { label: "Suggest a mediator", text: "Your suggestion was received as an accusation of unreasonableness. It was, slightly." },
        act: { label: "Cut the hedge yourself", text: "You cut it. You are now, permanently, in the folder." },
      },
      {
        text: "Someone's dog gets out and the other one brings it back without a word.",
        window: 10,
        need: "pass",
        pass: { text: "Nobody mentioned the hedge again. It grew over the line and stayed there." },
        tend: { label: "Note the thaw out loud", text: "You said something warm about it. Both remembered, freshly, that they were in a dispute." },
        act: { label: "Broker a settlement now", text: "You seized the moment to formalise peace. Formalising it made it a document, and documents have sides." },
      },
    ],
    endings: [
      { at: -999, key: "grew", rank: 0, title: "The hedge grew over it", text: "Nothing was resolved. They lend each other tools. That is resolution, in a valley.", effects: { town: 10 } },
      { at: -4, key: "cold", rank: 1, title: "Civil", text: "They are correct with each other now. Correct is colder than the hedge ever was.", effects: { town: -2 } },
      { at: 5, key: "court", rank: 2, title: "It went legal", text: "Solicitors. Two of them. Over sixty centimetres. The lane picked sides and stayed picked.", effects: { town: -14 } },
    ],
  },
  {
    id: "empty-shop",
    title: "The Shop On The Corner",
    domain: "town",
    loud: false,
    beats: [
      {
        text: "The hardware shop has started closing early on Wednesdays. Nobody has said anything about it.",
        window: 12,
        need: "tend",
        pass: { text: "You noticed and said nothing, along with everybody else." },
        tend: { label: "Buy something you need", text: "You bought your screws there instead of online. It was four pounds more and he talked for ten minutes." },
        act: { label: "Ask if he's in trouble", text: "You asked directly. He said no, in the voice of a man who could not afford to say yes to you." },
      },
      {
        text: "There is a handwritten sign about 'reviewing opening hours'. The handwriting is careful.",
        window: 11,
        need: "act",
        pass: { text: "The hours reduced again. Nobody organised anything, because organising is somebody else's job." },
        tend: { label: "Mention him around", text: "You spoke well of him to a few people. Goodwill does not pay a lease." },
        act: { label: "Get the lane to buy there", text: "You got eleven households to commit to one purchase a week. It was awkward to ask and it was enough." },
      },
      {
        text: "He is stocking things again. He has also started ordering in for people, which he did not do before.",
        window: 11,
        need: "pass",
        pass: { text: "You let him run his shop. He ran it." },
        tend: { label: "Keep checking in", text: "You kept checking in. He began to feel like a project rather than a shopkeeper." },
        act: { label: "Reorganise his business", text: "You brought him a spreadsheet about margins. He was polite about it and used none of it." },
      },
    ],
    endings: [
      { at: -999, key: "open", rank: 0, title: "Still open", text: "It is still there. It is the only place within nine miles that will sell you a single screw.", effects: { town: 12, self: 3 } },
      { at: -4, key: "reduced", rank: 1, title: "Three days a week", text: "It survives on reduced hours. Half the lane drives to the retail park now.", effects: { town: -3 } },
      { at: 5, key: "shut", rank: 2, title: "Shuttered", text: "It closed in the autumn. The window has a card in it thanking everyone for forty-one years.", effects: { town: -13 } },
    ],
  },
  {
    id: "stray",
    title: "The Dog Nobody Owns",
    domain: "town",
    loud: false,
    beats: [
      {
        text: "There is a thin dog at the end of the lane. It has been there three days and it will not come close.",
        window: 12,
        need: "tend",
        pass: { text: "It stayed at the far end of the lane, watching, for a fourth day." },
        tend: { label: "Leave food and go inside", text: "You put food down and went in without looking at it. In the morning the bowl was empty." },
        act: { label: "Catch it", text: "You cornered it by the gate. It bit you and ran, and did not come back to that lane." },
      },
      {
        text: "It sleeps under the oil tank now. It still will not let anyone within six feet.",
        window: 11,
        need: "pass",
        pass: { text: "You let it choose the distance. The distance got smaller by itself." },
        tend: { label: "Sit outside with it", text: "You sat out in the cold most evenings. It moved four feet closer over a fortnight." },
        act: { label: "Call the shelter", text: "The van came. It took two hours and a net and the dog was never the same about people." },
      },
      {
        text: "It follows you to the gate now. It stops at the gate.",
        window: 11,
        need: "tend",
        pass: { text: "You went through the gate and closed it. It waited outside, and kept waiting." },
        tend: { label: "Leave the gate open", text: "You left the gate open and went inside. It came in on its own, on the fourth night, and slept by the door." },
        act: { label: "Bring it in", text: "You carried it in. It spent two months under the stairs deciding whether the house was a trap." },
      },
    ],
    endings: [
      { at: -999, key: "chose", rank: 0, title: "It chose you", text: "It is asleep under the table as you read this. It came in on its own. That mattered to it, and it turns out it mattered to you.", effects: { self: 10, town: 4 } },
      { at: -4, key: "wary", rank: 1, title: "It stays, warily", text: "It lives here now and flinches at raised arms. It is a good dog with a note attached.", effects: { self: 3 } },
      { at: 5, key: "gone", rank: 2, title: "Gone by Friday", text: "It went to the next valley, or under a car, or somewhere. The lane is quiet in a way you notice.", effects: { self: -8, town: -4 } },
    ],
  },

  // ----------------------------------------------------------------- SELF
  {
    id: "the-ache",
    title: "The Thing In Your Side",
    domain: "self",
    loud: false,
    beats: [
      {
        text: "There is an ache under your ribs on the right. It has been there, on and off, since roughly February.",
        window: 12,
        need: "pass",
        pass: { text: "It faded for eleven days, the way it does, and you forgot about it entirely." },
        tend: { label: "Start noting when it comes", text: "You wrote down when it happened. The list was longer than your memory of it had been." },
        act: { label: "Search the internet", text: "You read for two hours and acquired four new fears and no information." },
      },
      {
        text: "It comes back and stays for a week. You start sleeping on the other side without deciding to.",
        window: 12,
        need: "act",
        pass: { text: "You slept on the other side. It kept being there, patiently, in the background of everything." },
        tend: { label: "Rest more", text: "You rested. Rest is excellent and it is not a diagnosis." },
        act: { label: "Make the appointment", text: "You made the call you had been not-making since February. The first appointment was in nine days." },
      },
      {
        text: "There is a course of treatment. It is dull, daily, and lasts three months.",
        window: 11,
        need: "tend",
        pass: { text: "You did most of it. 'Most of it' is a phrase doctors have opinions about." },
        tend: { label: "Build it into the day", text: "You attached it to the kettle in the morning and stopped thinking about it. You finished the course." },
        act: { label: "Overhaul everything", text: "You changed your diet, your sleep, and your job in six weeks. Two of those changes came back." },
      },
    ],
    endings: [
      { at: -999, key: "early", rank: 0, title: "Caught early", text: "It was small and it was dealt with and it is now a line in a file. Early is the entire story.", effects: { self: 14 } },
      { at: -4, key: "managed", rank: 1, title: "Ongoing", text: "It is managed. You think about it more days than you would like.", effects: { self: -2 } },
      { at: 5, key: "late", rank: 2, title: "Later than it should have been", text: "It was found in the autumn, by which point 'straightforward' was no longer the word anyone used.", effects: { self: -18, kin: -6 } },
    ],
  },
  {
    id: "old-idea",
    title: "The Thing You Keep Meaning To Make",
    domain: "self",
    loud: false,
    beats: [
      {
        text: "The idea surfaces again while you are doing something else. It is still good. It is still not started.",
        window: 11,
        need: "pass",
        pass: { text: "You let it go back under. It has been down there for years; it is comfortable." },
        tend: { label: "Write one line down", text: "You wrote a single line in the back of a notebook. It was there when you next looked." },
        act: { label: "Clear the weekend for it", text: "You cleared the weekend, sat down, and produced two hours of dread and no work." },
      },
      {
        text: "You have a free evening and no excuse available.",
        window: 11,
        need: "tend",
        pass: { text: "You watched three episodes of something you will not remember. The evening was fine." },
        tend: { label: "Do twenty minutes badly", text: "Twenty deliberately bad minutes. The badness was the unlock; there was now a thing to fix." },
        act: { label: "Do it properly", text: "You demanded a good first version of yourself and got a blank page and a bad mood." },
      },
      {
        text: "There is a rough, embarrassing, existing version. Someone has asked to see it.",
        window: 12,
        need: "act",
        pass: { text: "You did not send it. It is still in the folder, still rough, still yours alone." },
        tend: { label: "Promise to send it soon", text: "You promised. 'Soon' is where these go to be stored indefinitely." },
        act: { label: "Send it as it is", text: "You sent the embarrassing version. They replied with four notes, three of which were right." },
      },
    ],
    endings: [
      { at: -999, key: "exists", rank: 0, title: "It exists", text: "It is not what you imagined for nine years. It has the enormous advantage of being real.", effects: { self: 13, work: 5 } },
      { at: -4, key: "started", rank: 1, title: "Begun, at least", text: "There is a file with something in it. That is further than last year.", effects: { self: 3 } },
      { at: 5, key: "perfect", rank: 2, title: "Still perfect, still unmade", text: "It remains flawless and imaginary. Those are the two things it will always be.", effects: { self: -9 } },
    ],
  },
  {
    id: "comparison",
    title: "The Person You Measure Against",
    domain: "self",
    loud: true,
    beats: [
      {
        text: "They have announced something large. The announcement is well designed and does not mention the six years underneath it.",
        window: 9,
        need: "pass",
        pass: { text: "You read it, felt the thing, and put the phone face down. The feeling had a half-life of nine minutes." },
        tend: { label: "Congratulate them", text: "You sent congratulations. They were sincere and you re-read the post four more times." },
        act: { label: "Work out how they did it", text: "You spent the evening reverse-engineering a stranger's career. You learned nothing about your own." },
      },
      {
        text: "Someone mentions them to you, warmly, assuming you will be pleased.",
        window: 9,
        need: "pass",
        pass: { text: "You said something pleasant and meant about sixty percent of it. That is a normal percentage." },
        tend: { label: "Be honest about the sting", text: "You admitted it stung. The admission was healthy and the sting got a name and a residence." },
        act: { label: "Explain the context", text: "You provided context nobody asked for. It sounded exactly like what it was." },
      },
      {
        text: "You have an evening free and their name is in the search bar before you have decided anything.",
        window: 9,
        need: "pass",
        pass: { text: "You closed the tab. The evening turned out to have four usable hours in it." },
        tend: { label: "Mute them", text: "You muted them, which helped, and also made them slightly more significant than they were." },
        act: { label: "Compete", text: "You started something that evening for the wrong reason. Wrong reasons run out around week three." },
      },
    ],
    endings: [
      { at: -999, key: "own", rank: 0, title: "You got your evenings back", text: "They are doing well. It is genuinely nothing to do with you, and that turned out to be a relief.", effects: { self: 11 } },
      { at: -4, key: "nagging", rank: 1, title: "Still there, quieter", text: "You check occasionally. It costs you about an hour a month.", effects: { self: -2 } },
      { at: 5, key: "consumed", rank: 2, title: "A second job", text: "You have built a small unpaid career out of monitoring someone else's.", effects: { self: -12, work: -4 } },
    ],
  },

  // ---------------------------------------------------------------- WORLD
  {
    id: "distant-war",
    title: "The Thing On The News",
    domain: "world",
    loud: true,
    beats: [
      {
        text: "Something enormous is happening a long way away and there is footage of all of it, all the time.",
        window: 10,
        need: "pass",
        pass: { text: "You read enough to know what was true and then stopped. It kept happening either way." },
        tend: { label: "Follow it properly", text: "You followed it closely for a week. You were extremely well informed and no use to anybody." },
        act: { label: "Argue about it online", text: "You argued with strangers about a place neither of you has been. Nothing moved except your evening." },
      },
      {
        text: "There is a way to send money. It is small, and boring, and verifiable.",
        window: 11,
        need: "tend",
        pass: { text: "You meant to. You did not. The tab stayed open for eleven days and then did not." },
        tend: { label: "Send what you can, monthly", text: "You set up a small standing order and closed the tab. It is still going. It is not nothing." },
        act: { label: "Organise a fundraiser", text: "You organised something large. It took two months, raised slightly less than your standing order would have, and you have not opened the app since." },
      },
      {
        text: "It has stopped being on the front page. It has not stopped.",
        window: 10,
        need: "pass",
        pass: { text: "The standing order kept going after your attention stopped. Attention was never the useful part." },
        tend: { label: "Keep bringing it up", text: "You kept raising it at dinners. People began to brace when you sat down." },
        act: { label: "Reinvest completely", text: "You threw yourself at it for six weeks and then, entirely, stopped. The gap was louder than the effort." },
      },
    ],
    endings: [
      { at: -999, key: "steady", rank: 0, title: "A small steady thing", text: "You could not change it and did not pretend to. Something small and real went out every month regardless of how you felt.", effects: { world: 11, self: 4 } },
      { at: -4, key: "flicker", rank: 1, title: "On and off", text: "You gave in bursts, felt bad in the gaps, and the bursts got further apart.", effects: { world: -1, self: -2 } },
      { at: 5, key: "burnt", rank: 2, title: "Burned out on it", text: "You cared enormously for two months and then had to stop looking entirely. Nothing downstream of you changed either way.", effects: { world: -10, self: -8 } },
    ],
  },
  {
    id: "outrage",
    title: "The Thing Everyone Is Angry About Today",
    domain: "world",
    loud: true,
    beats: [
      {
        text: "A person you have never heard of has said something indefensible and the entire internet has been handed the same forty-second clip.",
        window: 9,
        need: "pass",
        pass: { text: "You did not watch the clip. By evening the clip had been established as missing its first forty seconds." },
        tend: { label: "Read the context first", text: "You did the responsible thing and read around it, thoroughly, for an hour. The hour is gone and the position you reached was 'it's complicated'." },
        act: { label: "Weigh in", text: "You weighed in. Two hundred people who already agreed with you agreed with you." },
      },
      {
        text: "It has reached the people you know. Someone has posted a long, sincere, slightly wrong summary.",
        window: 9,
        need: "pass",
        pass: { text: "You let the slightly wrong summary stand. It was corrected within the hour by somebody with more appetite for it." },
        tend: { label: "Gently correct them", text: "You corrected them gently in public. Gently in public is still in public, and they remembered." },
        act: { label: "Take it apart", text: "You took the summary apart point by point. You were right, and you spent a friendship's worth of goodwill on a stranger's scandal." },
      },
      {
        text: "There is now a second controversy about the way people reacted to the first one.",
        window: 9,
        need: "pass",
        pass: { text: "You missed the second one entirely, which is the only known way to win it." },
        tend: { label: "Post something measured", text: "Your measured take was quoted by both sides as evidence of the other's unseriousness." },
        act: { label: "Say what needs saying", text: "You said the thing that needed saying. It was screenshotted out of context by Thursday." },
      },
    ],
    endings: [
      { at: -999, key: "untouched", rank: 0, title: "You missed it", text: "You could not name the person now if asked. Nobody can. It occupied four days of the world's attention and left no mark on anything.", effects: { world: 8, self: 6 } },
      { at: -4, key: "grazed", rank: 1, title: "You caught the edge of it", text: "You lost an evening or two and one conversation got briefly sharp.", effects: { self: -3 } },
      { at: 5, key: "consumed", rank: 2, title: "You were in it", text: "You were, briefly, a participant in something that turned out to be nothing. Two people are still odd with you about it.", effects: { self: -11, town: -5, world: -4 } },
    ],
  },
];

export function threadById(id) {
  return THREADS.find((t) => t.id === id) || null;
}

export function threadsForDomain(domain) {
  return THREADS.filter((t) => t.domain === domain);
}

export function endingFor(thread, pressure) {
  let chosen = thread.endings[0];
  for (const ending of thread.endings) {
    if (pressure >= ending.at) chosen = ending;
  }
  return chosen;
}

// What this story would have become if you had never touched it.
export function passOnlyPressure(thread) {
  return thread.beats.reduce((total, beat) => total + pressureFor("pass", beat.need), 0);
}

export function counterfactualEnding(thread) {
  return endingFor(thread, passOnlyPressure(thread));
}

// A thread genuinely needs you if leaving it alone is not its best outcome.
export function needsYou(thread) {
  return counterfactualEnding(thread).rank > 0;
}

export function createRun(thread, day) {
  return {
    id: thread.id,
    thread,
    beatIndex: 0,
    pressure: 0,
    startedDay: day,
    revealed: false,
    choices: [],
    done: false,
  };
}

export function currentBeat(run) {
  return run.thread.beats[run.beatIndex] || null;
}

export function applyChoice(run, choice) {
  const beat = currentBeat(run);
  if (!beat) return { run, resolution: null };

  const delta = pressureFor(choice, beat.need);
  const next = {
    ...run,
    pressure: run.pressure + delta,
    beatIndex: run.beatIndex + 1,
    revealed: false,
    choices: [...run.choices, { choice, need: beat.need }],
  };
  next.done = next.beatIndex >= run.thread.beats.length;

  return {
    run: next,
    resolution: {
      choice,
      need: beat.need,
      right: choice === beat.need,
      text: beat[choice]?.text ?? "",
      threadTitle: run.thread.title,
    },
  };
}

export function finishRun(run) {
  const ending = endingFor(run.thread, run.pressure);
  const counterfactual = counterfactualEnding(run.thread);
  return { ending, counterfactual, changed: ending.key !== counterfactual.key };
}

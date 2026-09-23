"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allQuestions, textQuestions, type BttQuestion } from "./questions";
import "./btt.css";

type Mode = "daily" | "simulation" | "study";
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const storageKey = "btt-practice-v1";

export default function BttHome() {
  const [mode, setMode] = useState<Mode>("daily");
  const [questions, setQuestions] = useState<BttQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [seconds, setSeconds] = useState(3600);
  const [search, setSearch] = useState("");

  useEffect(() => { const data = JSON.parse(localStorage.getItem(storageKey) || "{}") as { wrong?: string[] }; setWrong(data.wrong ?? []); }, []);
  useEffect(() => { if (mode !== "simulation" || !started || completed || seconds <= 0) return; const id = window.setInterval(() => setSeconds((n) => n - 1), 1000); return () => clearInterval(id); }, [mode, started, completed, seconds]);
  const start = (nextMode: Mode) => { const pool = nextMode === "study" ? textQuestions : allQuestions; setMode(nextMode); setQuestions(shuffle(pool).slice(0, nextMode === "daily" ? 10 : nextMode === "simulation" ? 50 : 30)); setIndex(0); setChoice(null); setSubmitted(false); setAnswered({}); setCompleted(false); setStarted(true); setSeconds(3600); };
  const question = questions[index];
  const reveal = question && submitted;
  const score = Object.values(answered).filter(Boolean).length;
  const submit = () => { if (!question || choice === null) return; const correct = choice === question.answer; setAnswered((a) => ({ ...a, [question.id]: correct })); setSubmitted(true); if (!correct) { const nextWrong = Array.from(new Set([...wrong, question.id])); setWrong(nextWrong); localStorage.setItem(storageKey, JSON.stringify({ wrong: nextWrong })); } };
  const next = () => { if (index < questions.length - 1) { setIndex(index + 1); setChoice(null); setSubmitted(false); } else { setCompleted(true); } };
  const previous = () => { if (index > 0) { setIndex(index - 1); setChoice(null); setSubmitted(false); } };
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (!started || completed || !question || event.metaKey || event.ctrlKey || event.altKey) return; const key = event.key.toLowerCase(); if (!submitted && ["a", "b", "c", "d"].includes(key)) { event.preventDefault(); setChoice("abcd".indexOf(key)); } else if (event.key === "Enter" && (!submitted ? choice !== null : true)) { event.preventDefault(); if (submitted) next(); else submit(); } else if (submitted && event.key === "ArrowRight") { event.preventDefault(); next(); } else if (submitted && event.key === "ArrowLeft") { event.preventDefault(); previous(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [started, completed, question, submitted, choice, index, questions.length, wrong]);
  const mins = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const matches = useMemo(() => allQuestions.filter((q) => `${q.prompt} ${q.topic}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [search]);

  return <main className="btt-shell"><header className="btt-header"><span className="home-link">Singapore driving theory</span><strong>Singapore BTT Prep</strong><Link href="/btt/visual" className="visual-link">Visual Signage Quiz</Link></header>{!started ? <><section className="btt-hero"><p className="eyebrow">OFFICIAL HANDBOOK-BASED PRACTICE</p><h1>Pass BTT with confidence.</h1><p>Practice Singapore driving theory with source pages, explanations, and real handbook visuals.</p><div className="mode-grid"><button onClick={() => start("daily")}><b>Daily practice</b><span>10 questions · a focused warm-up</span></button><button onClick={() => start("simulation")}><b>BTT simulation</b><span>50 questions · 60 minutes</span></button><Link href="/btt/visual"><b>Visual signage quiz</b><span>Signs, markings, signals and situations</span></Link></div></section><section className="search-card"><label htmlFor="find">Search the question bank</label><input id="find" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. roundabout, amber, parking…" />{search && <div className="search-results">{matches.map((q) => <p key={q.id}><b>{q.topic}</b> · p.{q.page} · {q.prompt}</p>)}</div>}<p className="saved">{wrong.length} question{wrong.length === 1 ? "" : "s"} saved for review on this device.</p></section></> : completed ? <section className="quiz-wrap"><article className="quiz-card"><p className="topic-pill">Practice complete</p><h1>You scored {score} out of {questions.length}.</h1><p>{mode === "simulation" ? `Time remaining: ${mins}.` : "Nice work—review your saved questions or start another set."}</p><div className="next-row"><button onClick={() => setStarted(false)}>Back to home</button><button onClick={() => start(mode)}>Practice again →</button></div></article></section> : question ? <section className="quiz-wrap"><div className="quiz-meta"><span>{mode === "simulation" ? `Time ${mins}` : mode === "daily" ? "Daily practice" : "Study"}</span><span>Question {index + 1} of {questions.length}</span><span>Score {score}</span></div><div className="progress"><span style={{ width: `${(index / questions.length) * 100}%` }} /></div><article className="quiz-card"><p className="topic-pill">{question.topic}</p>{question.image && <button className="visual-frame" onClick={() => window.open(question.image, "_blank")} aria-label="Open a larger version of the visual"><img src={question.image} alt="Handbook visual for this BTT question" /></button>}<h1>{question.prompt}</h1><div className="choices">{question.options.map((option, i) => <button disabled={reveal} className={reveal ? i === question.answer ? "correct" : i === choice ? "incorrect" : "" : choice === i ? "selected" : ""} key={option} onClick={() => setChoice(i)}><span>{"ABCD"[i]}</span>{option}</button>)}</div>{!reveal ? <button className="submit" disabled={choice === null} onClick={submit}>Submit answer</button> : <div className="reveal"><b>{answered[question.id] ? "Correct" : "Not quite"}</b><p>{question.explanation}</p><p className="reference">Handbook p.{question.page} · {question.topic}</p><p className="reference">Keyboard: A–D choose · Enter submit/continue · ← → move</p><div className="next-row"><button disabled={index === 0} onClick={previous}>Previous</button><button onClick={next}>{index === questions.length - 1 ? "Finish practice →" : "Next question →"}</button></div></div>}</article></section> : null}</main>;
}

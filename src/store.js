import Vue from 'vue'
import Vuex from 'vuex'
import { ulid } from 'ulid'
import data from './assets/data.json'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    nQuiz: 5,
    nCandidate: 6,
    answerTime: 45,
    mode: "normal",
    results: [],
    quizzes: [],
    lines: [],
  },
  getters: {
    getMode: state => {
      return state.mode;
    },
    getNumberOfCandidate: state => {
      return state.nCandidate;
    },
    getAnswerTime: state => {
      return state.answerTime;
    },
    getResults: state => {
      if (state.results.length>0 && state.results.length===state.quizzes.length)
        return state.results 
    },
    getQuizzes: state => {
      return state.quizzes;
    },
    getFirstQuiz: (state) => {
      return state.quizzes[0];
    },
    getResultById: (state) => (id) => {
      return state.results.find(r=>r.id === id);
    },
    getQuizById: (state) => (id) => {
      return state.quizzes.find(q=>q.id === id);
    },
    getLines: (state) => {
      let lines = state.lines;
      if (lines.length===0) {
        const num = 10;
        // 名城線は 2号と4号とあり、クイズとして紛らわしいので候補から削除
        let items = data.filter(d=>d.nstation>=num&&!d.line.match(/名城線/));
        for (const item of items) lines.push(item.label);
        state.lines = lines;
      }
      return lines;
    },
    getNumberOfQuize: (state) => {
      return state.nQuiz;
    },
  },
  mutations: {
    setResult(state, result) {
      state.results.push(result);
    },
    setResults(state, results) {
      state.results = results;
    },
    setQuizzes(state, quizzes) {
      state.quizzes = quizzes;
    },
    setLines(state, lines) {
      state.lines = lines;
    },
    setMode(state, mode) {
      state.mode = mode;
      if (mode==="hard") {
        state.nCandidate = 4;
        state.answerTime = 30;
      } else if (mode==="easy") {
        state.nCandidate = 8;
        state.answerTime = 60;
      } else {
        state.nCandidate = 6;
        state.answerTime = 45;
      }
    },
    setNumberOfQuize: (state, number) => {
      state.nQuiz = +number;
    }
  },
  actions: {
    initialize(context) {
      context.commit("setResults", []);
      let quizzes = [];
      const lines = [...context.getters.getLines];
      for (let i=0;i<context.getters.getNumberOfQuize;i++) {
        const index = Math.floor(Math.random()*lines.length);
        quizzes.push({ label: lines[index] });
        lines.splice(index, 1);
      }
      quizzes.map((quiz,index)=>{
        quiz.id = ulid();
        quiz.index = index+1;
        if (index>0) quizzes[index-1].next = quiz.id;
      })
      context.commit("setQuizzes", quizzes);
    },
  }
})
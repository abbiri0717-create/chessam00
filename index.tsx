import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const EXERCISES = {
  '상체': ['팔굽혀펴기', '암워킹', '플랭크', '윗몸말아올리기', '숄더프레스'],
  '하체': ['스쿼트', '런지', '점프 스쿼트', '발꿈치 들기', '킥백'],
  '전신': ['슬로우 버피', '점핑잭', '마운틴 클라이머', '플랭크 잭', '슈퍼맨 운동'],
};

const ALL_EXERCISES = Object.values(EXERCISES).flat();
type ExerciseName = typeof ALL_EXERCISES[number] | string;

interface ExercisePlan {
  id: number;
  exercise: ExerciseName;
  exerciseDuration: number;
  restDuration: number;
}

interface CompletedWorkout {
  id: number;
  date: string;
  routine: ExercisePlan[];
  totalTime: number; // in seconds
  memo?: string;
}

type RecommendationLevel = '초급' | '중급' | '상급';

const MemoModal = ({ onSave, onSkip }: { onSave: (memo: string) => void; onSkip: () => void }) => {
  const [memo, setMemo] = useState('');

  return (
    <div className="memo-modal-overlay">
      <div className="memo-modal-content">
        <h2>🎉 운동 완료!</h2>
        <p>수고하셨습니다! 오늘의 운동은 어떠셨나요?<br/>간단한 메모를 남겨보세요.</p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 오늘은 컨디션이 좋아서 푸시업을 더 많이 할 수 있었다."
          rows={4}
        />
        <div className="memo-modal-actions">
          <button onClick={() => onSave(memo)} className="save-memo-btn">메모 저장</button>
          <button onClick={onSkip} className="skip-memo-btn">건너뛰기</button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (email: string) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const USERS_DB_KEY = 'calisthenicsUsers';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        
        // Admin login check
        if (email === 'admin@admin.com' && password === 'admin123') {
            onLogin('admin@admin.com');
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');

            if (isLogin) {
                // Login
                if (users[email] && users[email].password === password) {
                    onLogin(email);
                } else {
                    alert('이메일 또는 비밀번호가 잘못되었습니다.');
                }
            } else {
                // Sign up
                if (users[email]) {
                    alert('이미 사용 중인 이메일입니다.');
                } else {
                    const newUsers = { ...users, [email]: { password } };
                    localStorage.setItem(USERS_DB_KEY, JSON.stringify(newUsers));
                    alert('회원가입이 완료되었습니다!');
                    onLogin(email); // Log in directly
                }
            }
        } catch (error) {
            console.error("Error with user authentication", error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
    };
    
    const toggleForm = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
    };

    return (
        <div className="login-container">
            <main className="login-main">
                <div className="login-form">
                    <h1>맨몸운동 플래너</h1>
                    <p>{isLogin ? '로그인하여 운동 기록을 관리하세요' : '계정을 만들어 시작하세요'}</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">이메일</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                            />
                        </div>
                        <button type="submit">{isLogin ? '로그인' : '회원가입'}</button>
                    </form>
                    <div className="auth-toggle">
                        <span>{isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'} </span>
                        <button onClick={toggleForm}>
                            {isLogin ? '회원가입' : '로그인'}
                        </button>
                    </div>
                </div>
            </main>
            <footer className="app-footer">
                <p>&copy; che_ssam</p>
            </footer>
        </div>
    );
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [users, setUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [workouts, setWorkouts] = useState<Record<string, CompletedWorkout[]>>({});

    useEffect(() => {
        try {
            // Fetch all users
            const usersData = JSON.parse(localStorage.getItem('calisthenicsUsers') || '{}');
            const userEmails = Object.keys(usersData).filter(email => email !== 'admin@admin.com');
            setUsers(userEmails);

            // Fetch all workouts
            const allWorkouts: Record<string, CompletedWorkout[]> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('calisthenicsWorkouts_')) {
                    const email = key.replace('calisthenicsWorkouts_', '');
                    const userWorkouts = JSON.parse(localStorage.getItem(key) || '[]');
                    allWorkouts[email] = userWorkouts;
                }
            }
            setWorkouts(allWorkouts);
        } catch (error) {
            console.error("Failed to load admin data from localStorage", error);
        }
    }, []);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="app-container">
            <header className="app-header">
                <span className="user-greeting">관리자 대시보드</span>
                <button onClick={onLogout} className="logout-btn">로그아웃</button>
            </header>

            <div className="history-card">
                <h2>회원 목록</h2>
                {users.length > 0 ? (
                    <ul className="user-list">
                        {users.map(user => (
                            <li key={user}>
                                <button
                                    onClick={() => setSelectedUser(user)}
                                    className={selectedUser === user ? 'active' : ''}
                                >
                                    {user}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-list-message">등록된 회원이 없습니다.</p>
                )}
            </div>

            {selectedUser && (
                <div className="history-card">
                    <h2>{selectedUser}님의 운동 기록</h2>
                    {workouts[selectedUser] && workouts[selectedUser].length > 0 ? (
                        <ul className="workout-list">
                            {workouts[selectedUser].map(workout => (
                                <li key={workout.id} className="workout-item">
                                    <div className="workout-item-header">
                                        <h3>총 {Math.floor(workout.totalTime / 60)}분 {workout.totalTime % 60}초 운동</h3>
                                        <span className="workout-date">{formatDate(workout.date)}</span>
                                    </div>
                                    <ul className="routine-summary-list">
                                        {workout.routine.map((item, index) => <li key={index}>- {item.exercise} ({item.exerciseDuration}초)</li>)}
                                    </ul>
                                    {workout.memo && <p className="workout-memo">📝 메모: {workout.memo}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-list-message">이 사용자의 운동 기록이 없습니다.</p>
                    )}
                </div>
            )}
            
            <footer className="app-footer">
                <p>&copy; che_ssam</p>
            </footer>
        </div>
    );
};


const PlannerApp = ({ userEmail, onLogout }: { userEmail: string, onLogout: () => void }) => {
  const WORKOUTS_KEY = `calisthenicsWorkouts_${userEmail}`;

  // Data State
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>(() => {
    try {
      const saved = localStorage.getItem(WORKOUTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return [];
    }
  });
  const [routine, setRoutine] = useState<ExercisePlan[]>([]);
  const [recommendedRoutine, setRecommendedRoutine] = useState<{ reason: string; routine: ExercisePlan[] } | null>(null);
  
  // Recommendation Settings State
  const [recommendationLevel, setRecommendationLevel] = useState<RecommendationLevel>('중급');
  const [recommendationDuration, setRecommendationDuration] = useState<number>(20);

  // Form State
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName>('팔굽혀펴기');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('45');
  const [restDuration, setRestDuration] = useState('15');

  // Workout/Timer State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timerMode, setTimerMode] = useState<'work' | 'rest'>('work');
  const [timeLeft, setTimeLeft] = useState(0);
  const [workoutToMemo, setWorkoutToMemo] = useState<Omit<CompletedWorkout, 'id'> | null>(null);


  useEffect(() => {
    try {
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(completedWorkouts));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [completedWorkouts, WORKOUTS_KEY]);

  // Recommendation Logic
  useEffect(() => {
    const generateRecommendation = () => {
        const DURATION_SETTINGS = {
            '초급': { work: 30, rest: 30 },
            '중급': { work: 45, rest: 15 },
            '상급': { work: 50, rest: 10 },
        };

        const { work, rest } = DURATION_SETTINGS[recommendationLevel];
        const cycleDuration = work + rest;
        const totalSeconds = recommendationDuration * 60;
        const numberOfExercises = Math.max(3, Math.round(totalSeconds / cycleDuration));

        const reason = "균형 잡힌 신체 발달을 위해 상체, 하체, 전신 운동을 포함한 루틴을 추천합니다.";

        const shuffledUpper = [...EXERCISES['상체']].sort(() => 0.5 - Math.random());
        const shuffledLower = [...EXERCISES['하체']].sort(() => 0.5 - Math.random());
        const shuffledFull = [...EXERCISES['전신']].sort(() => 0.5 - Math.random());
        
        const newRoutineExercises: ExerciseName[] = [];
        for (let i = 0; i < numberOfExercises; i++) {
            const categoryIndex = i % 3;
            if (categoryIndex === 0) {
                newRoutineExercises.push(shuffledUpper[Math.floor(i / 3) % shuffledUpper.length]);
            } else if (categoryIndex === 1) {
                newRoutineExercises.push(shuffledLower[Math.floor(i / 3) % shuffledLower.length]);
            } else {
                newRoutineExercises.push(shuffledFull[Math.floor(i / 3) % shuffledFull.length]);
            }
        }
        
        const newRoutine = newRoutineExercises.map(ex => ({
            id: Date.now() + Math.random(),
            exercise: ex,
            exerciseDuration: work,
            restDuration: rest,
        }));

        setRecommendedRoutine({ reason, routine: newRoutine });
    };

    generateRecommendation();
  }, [recommendationLevel, recommendationDuration]);
  
  const handleSaveWorkoutWithMemo = useCallback((memo: string) => {
    if(workoutToMemo){
      const newCompletedWorkout: CompletedWorkout = {
        ...workoutToMemo,
        id: Date.now(),
        memo: memo.trim() || undefined,
      };
      setCompletedWorkouts(prev => [newCompletedWorkout, ...prev]);
    }
    setWorkoutToMemo(null);
    setRoutine([]);
  }, [workoutToMemo]);


  const isAddFormValid = () => {
    const isCustomExerciseValid = selectedExercise === '직접 추가...' ? customExerciseName.trim() !== '' : true;
    return isCustomExerciseValid && exerciseDuration && Number(exerciseDuration) > 0 && restDuration !== '' && Number(restDuration) >= 0;
  };
  
  const handleAddExerciseToRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddFormValid()) return;
    
    const exerciseName = selectedExercise === '직접 추가...' ? customExerciseName.trim() : selectedExercise;

    const newExercise: ExercisePlan = {
      id: Date.now(),
      exercise: exerciseName,
      exerciseDuration: Number(exerciseDuration),
      restDuration: Number(restDuration),
    };
    setRoutine([...routine, newExercise]);
    if(selectedExercise === '직접 추가...'){
        setCustomExerciseName('');
    }
  };
  
  const handleRemoveExerciseFromRoutine = (idToRemove: number) => {
    setRoutine(routine.filter(item => item.id !== idToRemove));
  };

  const handleDeleteWorkout = (idToDelete: number) => {
    setCompletedWorkouts(completedWorkouts.filter(workout => workout.id !== idToDelete));
  };

  const handleApplyRecommendation = () => {
    if (recommendedRoutine) {
      setRoutine(recommendedRoutine.routine);
    }
  };

  const handleStartWorkout = () => {
    if (routine.length === 0) return;
    setIsWorkoutActive(true);
    setIsPaused(false);
    setCurrentExerciseIndex(0);
    setTimerMode('work');
    setTimeLeft(routine[0].exerciseDuration);
  };
  
  const handleEndWorkout = useCallback((completed = false) => {
    setIsWorkoutActive(false);
    if (completed && routine.length > 0) {
      const totalTime = routine.reduce((acc, curr) => acc + curr.exerciseDuration + curr.restDuration, 0);
      const workoutDataToMemo: Omit<CompletedWorkout, 'id'> = {
        date: new Date().toISOString(),
        routine: [...routine],
        totalTime,
      };
      setWorkoutToMemo(workoutDataToMemo);
    } else {
        setRoutine([]);
    }
  }, [routine]);

  useEffect(() => {
    if (!isWorkoutActive || isPaused) {
        // It's good practice to stop any speech if the timer is paused or stopped.
        if (window.speechSynthesis?.speaking) {
            window.speechSynthesis.cancel();
        }
        return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);

    // Speech synthesis for countdown
    if (timeLeft > 0 && timeLeft <= 5) {
      try {
        const utterance = new SpeechSynthesisUtterance(timeLeft.toString());
        utterance.lang = 'ko-KR'; // Set language to Korean for correct pronunciation
        utterance.rate = 1.3; // Speak slightly faster to fit within the second
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Speech synthesis failed", error);
      }
    }
    
    if (timeLeft < 1) {
      clearInterval(timer);
      const currentExercise = routine[currentExerciseIndex];
      const nextIndex = currentExerciseIndex + 1;

      if (timerMode === 'work' && currentExercise.restDuration > 0) {
        setTimerMode('rest');
        setTimeLeft(currentExercise.restDuration);
      } else {
        if (nextIndex < routine.length) {
          setCurrentExerciseIndex(nextIndex);
          setTimerMode('work');
          setTimeLeft(routine[nextIndex].exerciseDuration);
        } else {
          handleEndWorkout(true);
        }
      }
    }
    
    return () => clearInterval(timer);
  }, [isWorkoutActive, isPaused, timeLeft, timerMode, currentExerciseIndex, routine, handleEndWorkout]);
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isWorkoutActive) {
    const currentExercise = routine[currentExerciseIndex];
    const nextExercise = routine[currentExerciseIndex + 1];
    return (
      <div className={`timer-view ${timerMode}`}>
        <p className="timer-status">{timerMode === 'work' ? '운동' : '휴식'}</p>
        <h2 className="current-exercise-name">{currentExercise.exercise}</h2>
        <div className="timer-display">{timeLeft}</div>
        <div className="progress-indicator">{currentExerciseIndex + 1} / {routine.length}</div>
        {nextExercise && <p className="next-exercise-info">다음 운동: {nextExercise.exercise}</p>}
        <div className="timer-controls">
          <button onClick={() => setIsPaused(!isPaused)}>{isPaused ? '계속' : '일시정지'}</button>
          <button onClick={() => handleEndWorkout(false)}>운동 종료</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {workoutToMemo && <MemoModal onSave={handleSaveWorkoutWithMemo} onSkip={() => handleSaveWorkoutWithMemo('')} />}
      <header className="app-header">
        <span className="user-greeting">안녕하세요, {userEmail}님!</span>
        <button onClick={onLogout} className="logout-btn">로그아웃</button>
      </header>

      <h1>맨몸운동 플래너</h1>

      {recommendedRoutine && (
        <div className="recommendation-card">
          <h2>🌟 오늘의 추천 운동</h2>
          <p className="recommendation-reason">{recommendedRoutine.reason}</p>

          <div className="recommendation-controls">
            <div className="control-group">
              <label>난이도</label>
              <div className="options">
                <button onClick={() => setRecommendationLevel('초급')} className={recommendationLevel === '초급' ? 'active' : ''}>초급</button>
                <button onClick={() => setRecommendationLevel('중급')} className={recommendationLevel === '중급' ? 'active' : ''}>중급</button>
                <button onClick={() => setRecommendationLevel('상급')} className={recommendationLevel === '상급' ? 'active' : ''}>상급</button>
              </div>
            </div>
            <div className="control-group">
               <label htmlFor="duration-select">총 운동 시간</label>
               <select
                 id="duration-select"
                 className="duration-select"
                 value={recommendationDuration}
                 onChange={(e) => setRecommendationDuration(Number(e.target.value))}
               >
                 {Array.from({ length: 60 }, (_, i) => i + 1).map(duration => (
                   <option key={duration} value={duration}>{duration}분</option>
                 ))}
               </select>
            </div>
          </div>

          <ul className="recommendation-list">
            {recommendedRoutine.routine.map(item => (
              <li key={item.id}>{item.exercise} (운동 {item.exerciseDuration}초 / 휴식 {item.restDuration}초)</li>
            ))}
          </ul>
          <button onClick={handleApplyRecommendation} className="apply-recommendation-btn">이 루틴으로 시작하기</button>
        </div>
      )}

      <div className="form-card">
        <h2>운동 루틴 계획하기</h2>
        <form onSubmit={handleAddExerciseToRoutine}>
          <div className="form-group">
            <label htmlFor="exercise">운동 선택</label>
            <select id="exercise" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value as ExerciseName)}>
              {Object.entries(EXERCISES).map(([category, exercises]) => (
                <optgroup label={category} key={category}>
                  {exercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                </optgroup>
              ))}
              <option value="직접 추가...">직접 추가...</option>
            </select>
          </div>
          {selectedExercise === '직접 추가...' && (
             <div className="form-group">
                <label htmlFor="customExerciseName">운동 이름</label>
                <input
                    id="customExerciseName"
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    placeholder="예: 버피 테스트"
                    required
                />
             </div>
          )}
          <div className="input-row">
            <div className="form-group"><label htmlFor="exerciseDuration">운동 시간 (초)</label><input id="exerciseDuration" type="number" value={exerciseDuration} onChange={(e) => setExerciseDuration(e.target.value)} placeholder="예: 45" min="1"/></div>
            <div className="form-group"><label htmlFor="restDuration">쉬는 시간 (초)</label><input id="restDuration" type="number" value={restDuration} onChange={(e) => setRestDuration(e.target.value)} placeholder="예: 15" min="0"/></div>
          </div>
          <button type="submit" disabled={!isAddFormValid()}>루틴에 추가</button>
        </form>
      </div>

      <div className="routine-card">
        <h2>오늘의 운동 루틴</h2>
        {routine.length > 0 ? (
          <>
            <ul className="routine-list">
              {routine.map(item => (
                <li key={item.id} className="routine-item">
                  <div className="routine-item-details">
                    <strong>{item.exercise}</strong>
                    <span>(운동 {item.exerciseDuration}초 / 휴식 {item.restDuration}초)</span>
                  </div>
                  <button onClick={() => handleRemoveExerciseFromRoutine(item.id)} className="remove-routine-item-btn" aria-label="삭제">&times;</button>
                </li>
              ))}
            </ul>
            <button onClick={handleStartWorkout} className="start-workout-btn" disabled={routine.length === 0}>운동 시작</button>
          </>
        ) : <p className="empty-list-message">운동을 추가하여 루틴을 만들어주세요.</p>}
      </div>

      <div className="history-card">
        <h2>운동 기록</h2>
        {completedWorkouts.length > 0 ? (
          <ul className="workout-list">
            {completedWorkouts.map(workout => (
              <li key={workout.id} className="workout-item">
                <button onClick={() => handleDeleteWorkout(workout.id)} className="delete-workout-btn" aria-label="기록 삭제">&times;</button>
                <div className="workout-item-header">
                  <h3>총 {Math.floor(workout.totalTime / 60)}분 {workout.totalTime % 60}초 운동</h3>
                  <span className="workout-date">{formatDate(workout.date)}</span>
                </div>
                <ul className="routine-summary-list">
                  {workout.routine.map((item, index) => <li key={index}>- {item.exercise} ({item.exerciseDuration}초)</li>)}
                </ul>
                {workout.memo && <p className="workout-memo">📝 메모: {workout.memo}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="empty-list-message">아직 완료된 운동이 없습니다.</p>}
      </div>

      <footer className="app-footer">
        <p>&copy; che_ssam</p>
      </footer>
    </div>
  );
};

const App = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(() => {
        try {
            return localStorage.getItem('calisthenicsCurrentUser');
        } catch (error) {
            console.error("Error reading from localStorage", error);
            return null;
        }
    });

    const handleLogin = (email: string) => {
        try {
            localStorage.setItem('calisthenicsCurrentUser', email);
            setCurrentUser(email);
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('calisthenicsCurrentUser');
            setCurrentUser(null);
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser === 'admin@admin.com') {
        return <AdminDashboard onLogout={handleLogout} />;
    }

    return <PlannerApp userEmail={currentUser} onLogout={handleLogout} />;
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
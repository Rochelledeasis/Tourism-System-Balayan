
import { useState, useEffect } from 'react';

import AppointmentForm from './Components/Appointment.jsx';
import Review from './Components/Review.jsx';
import Confirmation from './Components/Confirmation.jsx';
import Track from './Components/Track.jsx';
import Change from './Components/Change.jsx';
import Home from './Components/Home.jsx';
import SurveyForm from './Survey/SurveyForm.jsx';
import ResponsesPage from './Survey/ResponsesPage.jsx';
import './Survey/survey.css';

const empty = {
  visitorType: 'Citizen',
  serviceId: '',
  serviceName: '',
  date: '',
  time: '',
  purpose: '',
  fullName: '',
  email: '',
  mobile: '',
};

function Stepper({ step }) {
  const items = ['Details', 'Review', 'Confirmation'];

  return (
    <ol className="stepper">
      {items.map((label, i) => {
        const n = i + 1;
        const state =
          step > n || step === 3
            ? 'done'
            : step === n
              ? 'current'
              : '';

        return (
          <li key={label} className={state}>
            <span>{state === 'done' ? '✓' : n}</span> {label}
          </li>
        );
      })}
    </ol>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState(null);
  const [trackRef, setTrackRef] = useState('');
  const [flash, setFlash] = useState('');
  const goSurvey = () => setView('survey');
  const goResponses = () => setView('responses');

  // Change browser tab title and icon
  useEffect(() => {
    document.title =
      view === 'home'
        ? 'Tourism Balayan'
        : 'Tourism Appointment';

    let favicon = document.querySelector("link[rel~='icon']");

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    favicon.href = '/balayanlogo.png';
  }, [view]);

  // Navigate to homepage
  const goHome = () => {
    setView('home');
  };

  // Navigate to appointment booking
  const goBook = (e) => {
    e?.preventDefault();
    setView('book');
    setStep(1);
  };

  // Navigate to tracking
  const goTrack = (ref = '', message = '') => {
    setTrackRef(ref);
    setFlash(message);
    setView('track');
  };

  // Restart appointment
  const restart = () => {
    setForm({ ...empty });
    setResult(null);
    setStep(1);
    setView('book');
  };

  return (
    <>
      {/* HOMEPAGE */}
      {view === 'home' && (
        <Home
          onBook={goBook}
          onTrack={() => goTrack()}
          onSurvey={goSurvey}
          onResponses={goResponses}
        />
      )}

      {/* APPOINTMENT BOOKING */}

      {/* SURVEY AND SURVEY RESPONSES */}
{(view === 'survey' || view === 'responses') && (
  <>
    <header className="topbar">
      <div className="brand">
        <img
          src="/balayanlogo.png"
          alt="Visit Balayan logo"
          className="logo"
        />
        <div>
          <strong>Visit Balayan</strong>
          <small>Tourism Office of Balayan</small>
        </div>
      </div>

      <nav aria-label="Main navigation">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
        >
          Home
        </a>

        <a
          href="#survey"
          className={view === 'survey' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            goSurvey();
          }}
        >
          Survey
        </a>

        <a
          href="#responses"
          className={view === 'responses' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            goResponses();
          }}
        >
          Responses
        </a>

        <button className="btn primary" onClick={goBook}>
          Book an Appointment
        </button>
      </nav>
    </header>

    <div className="csm-page">
      {view === 'survey' ? (
        <SurveyForm />
      ) : (
        <ResponsesPage />
      )}
    </div>
  </>
)}

      {view === 'book' && (
        <>
          <header className="topbar">
            <div className="brand">
              <img
                src="/balayanlogo.png"
                alt="Visit Balayan logo"
                className="logo"
              />
              <div>
                <strong>Visit Balayan</strong>
                <small>Tourism Office of Balayan</small>
              </div>
            </div>

            <nav>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  goHome();
                }}
              >
                Home
              </a>

              <a href="#book" className="active">
                Book appointment
              </a>

              <a
                href="#track"
                onClick={(e) => {
                  e.preventDefault();
                  goTrack();
                }}
              >
                Track appointment
              </a>
            </nav>
          </header>

          <main className={step === 3 ? 'narrow' : ''}>
            {step !== 3 && (
              <>
                <h1>
                  {step === 1
                    ? 'Book your appointment'
                    : 'Review your appointment'}
                </h1>

                <p className="sub">
                  {step === 1
                    ? 'Choose your visitor type and tell us when and why you would like to visit.'
                    : 'Please check everything below. You can still make changes before you submit.'}
                </p>
              </>
            )}

            <Stepper step={step} />

            {step === 1 && (
              <AppointmentForm
                form={form}
                setForm={setForm}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <Review
                form={form}
                onEdit={() => setStep(1)}
                onDone={(r) => {
                  setResult(r);
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <Confirmation
                form={form}
                result={result}
                onNew={restart}
                onTrack={(ref) => goTrack(ref)}
              />
            )}
          </main>
        </>
      )}

      {/* TRACK APPOINTMENT */}
      {view === 'track' && (
        <>
          <header className="topbar">
            <div className="brand">
              <img
                src="/balayanlogo.png"
                alt="Visit Balayan logo"
                className="logo"
              />
              <div>
                <strong>Visit Balayan</strong>
                <small>Tourism Office of Balayan</small>
              </div>
            </div>

            <nav>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  goHome();
                }}
              >
                Home
              </a>

              <a
                href="#book"
                onClick={goBook}
              >
                Book appointment
              </a>

              <a href="#track" className="active">
                Track appointment
              </a>
            </nav>
          </header>

          <main>
            <Track
              key={trackRef}
              initialRef={trackRef}
              flash={flash}
              onChange={(ref) => {
                setTrackRef(ref);
                setFlash('');
                setView('change');
              }}
            />
          </main>
        </>
      )}

      {/* CHANGE / RESCHEDULE APPOINTMENT */}
      {view === 'change' && (
        <>
          <header className="topbar">
            <div className="brand">
              <img
                src="/balayanlogo.png"
                alt="Visit Balayan logo"
                className="logo"
              />
              <div>
                <strong>Visit Balayan</strong>
                <small>Tourism Office of Balayan</small>
              </div>
            </div>

            <nav>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  goHome();
                }}
              >
                Home
              </a>

              <a
                href="#book"
                onClick={goBook}
              >
                Book appointment
              </a>

              <a
                href="#track"
                onClick={(e) => {
                  e.preventDefault();
                  goTrack(trackRef);
                }}
              >
                Track appointment
              </a>
            </nav>
          </header>

          <main>
            <Change
              reference={trackRef}
              onBack={() => goTrack(trackRef)}
              onDone={(message) => goTrack(trackRef, message)}
            />
          </main>
        </>
      )}
    </>
  );
}

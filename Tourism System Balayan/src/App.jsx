
import { useState } from 'react';

import AppointmentForm from './Components/Appointment.jsx';
import Review from './Components/Review.jsx';
import Confirmation from './Components/Confirmation.jsx';
import Track from './Components/Track.jsx';
import Change from './Components/Change.jsx';
import Home from './pages/home.jsx';

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState(null);

  // Navigation
  const [view, setView] = useState('home');
  const [trackRef, setTrackRef] = useState('');
  const [flash, setFlash] = useState('');

  // Restart appointment
  const restart = () => {
    setForm(empty);
    setResult(null);
    setStep(1);
  };

  // Open Track Appointment
  const goTrack = (ref = '', message = '') => {
    setTrackRef(ref);
    setFlash(message);
    setView('track');
  };

  // Open Book Appointment
  const goBook = (e) => {
    e?.preventDefault();
    setView('book');
  };

  return (
    <>
      {/* LANDING PAGE */}
      {view === 'home' && (
        <Home
          onBook={goBook}
          onTrack={() => goTrack()}
        />
      )}

      {/* APPOINTMENT NAVIGATION */}
      {view !== 'home' && (
        <header className="topbar">
          <div
            className="brand"
            onClick={() => setView('home')}
            style={{ cursor: 'pointer' }}
          >
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
                setView('home');
              }}
            >
              Home
            </a>

            <a
              className={view === 'book' ? 'active' : ''}
              href="#book"
              onClick={goBook}
            >
              Book Appointment
            </a>

            <a
              className={
                view === 'track' || view === 'change'
                  ? 'active'
                  : ''
              }
              href="#track"
              onClick={(e) => {
                e.preventDefault();
                goTrack();
              }}
            >
              Track Appointment
            </a>
          </nav>
        </header>
      )}

      {/* TRACK APPOINTMENT */}
      {view === 'track' && (
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
      )}

      {/* CHANGE / RESCHEDULE APPOINTMENT */}
      {view === 'change' && (
        <main>
          <Change
            reference={trackRef}
            onBack={() => goTrack(trackRef)}
            onDone={(message) => goTrack(trackRef, message)}
          />
        </main>
      )}

      {/* BOOK APPOINTMENT */}
      {view === 'book' && (
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
      )}
    </>
  );
}

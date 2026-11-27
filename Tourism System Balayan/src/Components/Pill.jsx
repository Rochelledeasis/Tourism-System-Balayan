export default function Pill({ status, dot }) {
  return <span className={`pill ${status.toLowerCase()}`}>{dot && '● '}{status}</span>;
}

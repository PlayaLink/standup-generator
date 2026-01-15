export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Weekly Standup Generator - Teams</h1>
      <p>This is the Microsoft Teams bot for generating weekly standup reports.</p>
      <h2>How to use:</h2>
      <ol>
        <li>Add the bot to your Teams workspace</li>
        <li>Message the bot with <code>setup</code> to connect your Jira account</li>
        <li>Select your Jira board</li>
        <li>Message the bot with <code>standup</code> to generate your report</li>
      </ol>
    </main>
  );
}

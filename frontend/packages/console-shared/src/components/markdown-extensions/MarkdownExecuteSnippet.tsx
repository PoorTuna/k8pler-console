import * as React from 'react';

type MarkdownExecuteCommandProps = {
  docContext: HTMLDocument;
  rootSelector: string;
};

// The "Run in Web Terminal" markdown execute button required the Web
// Terminal (webterminal-plugin) operator, which this fork drops -- there is
// no terminal to execute into. Kept as a no-op so markdown-extensions/index.ts
// and its Quick Starts caller don't need to special-case its absence.
const MarkdownExecuteSnippet: React.FC<MarkdownExecuteCommandProps> = () => null;

export default MarkdownExecuteSnippet;

import * as React from 'react';
import { shallow } from 'enzyme';
import MarkdownExecuteSnippet from '../MarkdownExecuteSnippet';

describe('MarkdownExecuteSnippet', () => {
  it('renders nothing (Web Terminal is not available in this fork)', () => {
    const wrapper = shallow(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
  });
});

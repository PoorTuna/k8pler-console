import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

// Local stand-in for dev-console's CreateProjectListPage, which pulled in the full
// ProjectListPage subsystem (project tiles, create-project affordance) just to render this
// prompt. The masthead's own namespace dropdown already covers selecting -- and, via its
// "Create Namespace" entry, creating -- a project, so this only needs to explain why the page
// is empty.
export const SelectProjectEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Bullseye>
      <EmptyState>
        <EmptyStateHeader
          titleText={t('topology~Select a project')}
          icon={<EmptyStateIcon icon={CubesIcon} />}
          headingLevel="h2"
        />
        <EmptyStateBody>
          {t('topology~Select a project from the dropdown above to view its topology.')}
        </EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};

export default SelectProjectEmptyState;

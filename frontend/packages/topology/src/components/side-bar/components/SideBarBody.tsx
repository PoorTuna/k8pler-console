import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { SimpleTabNav, Tab } from '@console/internal/components/utils';
import { useQueryParams } from '@console/shared/src';
import SideBarTabLoader from '../providers/SideBarTabLoader';

// Upstream persists the selected tab in the `UI.overview.selectedDetailsTab` redux slice, which
// was dev-console's project-overview sidebar state and was removed with the rest of dev-console.
// Local state keeps the same in-session behavior without that cross-page persistence.
const SimpleTabNavWrapper: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = React.useState<string>(null);
  const queryParams = useQueryParams();
  const selectTabParam = queryParams.get('selectTab');
  return (
    <SimpleTabNav
      selectedTab={selectTabParam || selectedTab || t('topology~Details')}
      tabs={tabs}
      tabProps={null}
      onClickTab={setSelectedTab}
      additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
    />
  );
};

const SideBarBody: React.FC<{ element: GraphElement }> = ({ element }) => {
  const uid = element.getId();
  return (
    <SideBarTabLoader key={uid} element={element}>
      {(tabs, loaded) => (loaded ? <SimpleTabNavWrapper tabs={tabs} /> : null)}
    </SideBarTabLoader>
  );
};

export default SideBarBody;

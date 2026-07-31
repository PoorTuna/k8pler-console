import * as React from 'react';
import * as semver from 'semver';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@patternfly/react-icons/dist/esm/icons/flag-icon';

import { useOpenShiftVersion } from '@console/shared/src';
import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';
import { DOC_URL_OPENSHIFT_WHATS_NEW } from '../../../../utils';

export const ExploreAdminFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  // This card only renders behind FLAGS.OPENSHIFT (see getting-started-section.tsx),
  // so the OperatorHub-backed Lightspeed probe this used to do is not applicable here.
  const lightspeedIsAvailable = false;

  const links: GettingStartedLink[] = React.useMemo(
    () => [
      {
        id: 'openshift-ai',
        title: t('public~OpenShift AI'),
        description: t('public~Build, deploy, and manage AI-enabled applications.'),
        href:
          '/operatorhub/all-namespaces?keyword=openshift+ai&details-item=rhods-operator-redhat-operators-openshift-marketplace',
      },
      ...(lightspeedIsAvailable
        ? [
            {
              id: 'lightspeed',
              title: t('public~OpenShift Lightspeed'),
              description: t('public~Your personal AI helper.'),
              href:
                '/operatorhub/all-namespaces?keyword=lightspeed&details-item=lightspeed-operator-redhat-operators-openshift-marketplace',
            },
          ]
        : [
            {
              id: 'new-translations',
              title: t('public~French and Spanish now available'),
              description: t('public~Console language options now include French and Spanish.'),
              href: '/user-preferences/language',
            },
          ]),
    ],
    [t, lightspeedIsAvailable],
  );

  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';
  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("public~See what's new in OpenShift {{version}}", { version }),
    href: DOC_URL_OPENSHIFT_WHATS_NEW,
    external: true,
  };

  return (
    <GettingStartedCard
      id="admin-features"
      icon={<FlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />}
      title={t('public~Explore new features and capabilities')}
      titleColor={'var(--co-global--palette--orange-400)'}
      links={links}
      moreLink={moreLink}
    />
  );
};

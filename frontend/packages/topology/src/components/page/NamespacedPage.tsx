import * as React from 'react';
import * as cx from 'classnames';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import NamespaceBarApplicationSelector from '../dropdowns/NamespaceBarApplicationSelector';

import './NamespacedPage.scss';

// Local stand-in for the dev-console NamespacedPage (deleted along with the rest of dev-console).
// Unlike dev-console's version, this fork's masthead already renders the real NamespaceBar for
// any route under a `namespacedPrefixes` entry (see public/components/utils/link.tsx), so this
// only needs to slot the topology-specific toolbar and application-group selector into it.
export enum NamespacedPageVariants {
  light = 'light',
  default = 'default',
}

export interface NamespacedPageProps {
  disabled?: boolean;
  hideProjects?: boolean;
  hideApplications?: boolean;
  onNamespaceChange?: (newNamespace: string) => void;
  variant?: NamespacedPageVariants;
  toolbar?: React.ReactNode;
}

const NamespacedPage: React.FC<NamespacedPageProps> = ({
  children,
  disabled,
  onNamespaceChange,
  hideProjects = false,
  hideApplications = false,
  variant = NamespacedPageVariants.default,
  toolbar,
}) => (
  <div className="odc-namespaced-page">
    <NamespaceBar
      isDisabled={disabled}
      onNamespaceChange={onNamespaceChange}
      hideProjects={hideProjects}
    >
      {!hideApplications && <NamespaceBarApplicationSelector disabled={disabled} />}
      {toolbar && <div className="odc-namespaced-page__toolbar">{toolbar}</div>}
    </NamespaceBar>
    <div
      className={cx('odc-namespaced-page__content', {
        [`is-${variant}`]: variant !== NamespacedPageVariants.default,
      })}
    >
      {children}
    </div>
  </div>
);

export default NamespacedPage;

import * as _ from 'lodash';
import { Plugin, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import { defaultDecoratorsPlugin } from './components/graph-view/components/nodes/decorators/defaultDecoratorsPlugin';
import { TopologyDecoratorProvider } from './extensions';
import * as models from './models';

// Upstream also spreads in operatorsTopologyPlugin here, which grouped workloads by their
// owning OLM operator (CSV). OLM isn't part of this fork, so that whole subtree
// (src/operators/) was dropped along with its plugin registration.
type ConsumedExtensions = ModelDefinition | ModelFeatureFlag | TopologyDecoratorProvider;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  ...defaultDecoratorsPlugin,
];

export default plugin;

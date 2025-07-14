// packages/package-name/rollup.config.js
import createConfig from '../../rollup.config.base.js';
import packageJson  from './package.json';

export default createConfig(packageJson);

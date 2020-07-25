import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './mars.js',
  output: {
    file: './build/mars.js',
    format: 'cjs',
    name: 'mars',
  },
  plugins: [resolve(), commonjs(), json(), terser()],
};

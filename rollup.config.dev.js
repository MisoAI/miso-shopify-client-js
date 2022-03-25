import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/miso-shopify.js',
    format: 'umd',
    indent: true
  },
  watch: true,
  plugins: [
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        __version__: JSON.stringify('dev')
      }
    }),
    nodeResolve(),
    serve({
      port: 10301,
      //https: true
    }),
    livereload({
      delay: 500,
      watch: 'dist',
    }),
  ],
};

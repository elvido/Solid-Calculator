import baseConfig from "./rollup.config.base.js";
import serve from './plugins/rollup-plugin-express-serve.js';
import livereload from "rollup-plugin-livereload";
import { exampleMocking } from './plugins/example-mocking-plugin.js';

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    sourcemap: false
  },
    plugins: [    
      ...baseConfig.plugins,
      serve({
      open: true,             
      contentBase: "dist",  
      port: 3000, 
      verbose: true,
      traceRequests: false,     
      proxy: {
        '/api': 'http://localhost:3001',
        '/health': { target: 'http://localhost:3001/api/status', stripPrefix: true }
      }, 
      middleware: [exampleMocking()]
    }),
    livereload({
      watch: "dist",
      verbose: true,
      delay: 500
    })
  ],
  watch: {
    ...baseConfig.watch,
    chokidar: true,
    clearScreen: false,  
    buildDelay: 500,      
    skipWrite: false     
  }
};
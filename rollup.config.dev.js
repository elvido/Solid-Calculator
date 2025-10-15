import baseConfig from "./rollup.config.base.js";
import serve from './plugins/rollup-express-serve.js';
import livereload from "rollup-plugin-livereload";

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
      traceRequests: true,     
      proxy: {
        '/api': 'http://localhost:3001'
      }
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
require('shelljs/global');
config.silent = true;
var fs = require('fs');
var path = require('path');
//use paths, so libs don't need a -g
var browserify = path.join('node_modules', '.bin', 'browserify');
var derequire = path.join('node_modules', '.bin', 'derequire');
var uglify = path.join('node_modules', '.bin', 'uglifyjs');
var eslint = path.join('node_modules', '.bin', 'eslint');

var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

//first, run linter
var child = exec(eslint + ' -c .eslintrc --color ./src/**', {
  async: true,
});
child.stdout.on('error', function() {
  //(exit if linter finds errors)
  process.exit();
});

//final build locations
var banner = '/* @smallwins/spacetime v' + pkg.version + '\n  \n*/\n';
var uncompressed = './builds/spacetime.js';
var compressed = './builds/spacetime.min.js';

//cleanup. remove old builds
exec('rm -rf ./builds && mkdir builds');

//add a header, before our sourcecode
echo(banner).to(uncompressed);
echo(banner).to(compressed);

//browserify + derequire
var cmd = browserify + ' ./src/index.js --standalone spacetime';
cmd += ' -t [ babelify --presets [ es2015 stage-2 ] ]';
cmd += ' | ' + derequire;
cmd += ' >> ' + uncompressed;
exec(cmd);

//uglify
cmd = uglify + ' ' + uncompressed + ' --mangle --compress ';
cmd += ' >> ' + compressed;
exec(cmd); // --source-map ' + compressed + '.map'

//print filesizes
var stats = fs.statSync(compressed);
var fileSize = (stats['size'] / 1000.0).toFixed(2);
console.log('\n\n es5: - - ' + fileSize + 'kb');

var semver = require('semver');

function update (compilerVersion, abi) {
  var hasConstructor = false;
  var hasFallback = false;

  for (var i = 0; i < abi.length; i++) {
    var item = abi[i];

    if (item.type === 'constructor') {
      hasConstructor = true;

      // <0.4.5 assumed every constructor to be payable
      if (semver.lt(compilerVersion, '0.4.5')) {
        item.payable = true;
      }
    } else if (item.type === 'fallback') {
      hasFallback = true;
    }

    if (item.type !== 'event') {
      // add 'payable' to everything
      if (semver.lt(compilerVersion, '0.4.0')) {
        item.payable = true;
      }

      // add stateMutability field
      if (semver.lt(compilerVersion, '0.4.16')) {
        if (item.payable) {
          item.stateMutability = 'payable';
        } else if (item.constant) {
          item.stateMutability = 'view';
        } else {
          item.stateMutability = 'nonpayable';
        }
      }

      // remove constant field
      delete item['constant'];
    }
  }

  // 0.1.2 from Aug 2015 had it. The code has it since May 2015 (e7931ade)
  if (!hasConstructor && semver.lt(compilerVersion, '0.1.2')) {
    abi.push({
      type: 'constructor',
      payable: true,
      stateMutability: 'payable',
      inputs: []
    });
  }

  if (!hasFallback && semver.lt(compilerVersion, '0.4.0')) {
    abi.push({
      type: 'fallback',
      payable: true,
      stateMutability: 'payable'
    });
  }

  return abi;
}

function downgrade (compilerVersion, abi) {
  if (semver.neq(compilerVersion, '0.4.24')) {
    throw new Error('The specified compiler version is not supported for ABI downgrades. Currently only downgrades from 0.5.* ABIs to 0.4.24 ABIs are supported.');
  }

  for (var i = 0; i < abi.length; i++) {
    var item = abi[i];
    if (item.stateMutability === 'view' || item.stateMutability === 'pure' || item.constant) {
      item.constant = true;
    } else {
      item.constant = false;
    }
  }

  return abi;
}

function translate (abi, inputVersion, outputVersion) {
  if (semver.neq(inputVersion, '0.5.0') {
    abi = update(inputVersion, abi);
  }
  if (semver.neq(outputVersion, '0.5.0') {
    abi = downgrade(outputVersion, abi);
  }
  return abi;
}

module.exports = {
  downgrade: downgrade,
  translate: translate,
  update: update
};

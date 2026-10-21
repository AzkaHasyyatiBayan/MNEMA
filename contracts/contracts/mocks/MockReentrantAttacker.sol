// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MnemaLedger} from "../MnemaLedger.sol";

/**
 * @title MockReentrantAttacker
 * @dev Kontrak eksploitasi simulasi untuk menguji ketahanan reentrancy dan kontrol akses pada MnemaLedger.
 */
contract MockReentrantAttacker {
    MnemaLedger public target;
    bytes32 public docHash;

    constructor(address _target) {
        target = MnemaLedger(_target);
    }

    function attackCreate(
        bytes32 _docHash,
        string calldata _cid,
        string calldata _title,
        string calldata _uri
    ) external {
        docHash = _docHash;
        target.createMemoryRecord(_docHash, _cid, _title, _uri);
    }

    // Fallback receiver
    receive() external payable {}
}

import * as os from 'os';
import { linesParser } from './linesParser';
const example=`======= ./examples/HelloWorld.solpp:HelloWorld =======
EVM assembly:
=======
  // ContractCompiler::initializeContext()
  // ContractCompiler::registerImmutableVariables()
  // end of ContractCompiler::registerImmutableVariables()
    /* "./examples/HelloWorld.solpp":26:249  contract HelloWorld {... */
  0x80
  // CompilerUtils::storeFreeMemoryPointer()
  0x40
  mstore
  // end of CompilerUtils::storeFreeMemoryPointer()
  // ContractCompiler::registerStateVariables()
  // end of ContractCompiler::registerStateVariables()
  // ContractCompiler::initializeStateVariables()
  // end of ContractCompiler::initializeStateVariables()
  // ContractCompiler::appendCallValueCheck()
  callvalue
  dup1
  iszero
  tag_2
  jumpi
  revert(0x00, 0x00)
tag_2:
  pop
  // end of ContractCompiler::appendCallValueCheck()
  jump(tag_3)
  // CompilerContext::appendYulUtilityFunctions()
tag_3:
  dataSize(sub_0)
  dup1
  dataOffset(sub_0)
  0x00
  codecopy
  0x00
  return
stop

sub_0: assembly {
  // ContractCompiler::initializeContext()
        /* "./examples/HelloWorld.solpp":26:249  contract HelloWorld {... */
      0x80
  // CompilerUtils::storeFreeMemoryPointer()
      0x40
      mstore
  // end of CompilerUtils::storeFreeMemoryPointer()
  // ContractCompiler::registerStateVariables()
  // end of ContractCompiler::registerStateVariables()
      jump(tag_1)
        /* "./examples/HelloWorld.solpp":109:247  onMessage SayHello(address addr) payable {... */
    tag_2:  // declaration of function SayHello
  // Add parameters
  // Add return parameters
  // ContractCompiler::appendModifierOrFunctionCode() for SayHello(address)
  // start of code block of SayHello(address)
  // ExpressionCompiler::visit(_memberAccess=addr.transfer)
  // ExpressionCompiler::appendVariable(address payable addr, addr)
        /* "./examples/HelloWorld.solpp":160:164  addr */
      dup1
  // CompilerUtils::convertType(): address payable -> address payable
        /* "./examples/HelloWorld.solpp":160:173  addr.transfer */
      0xffffffffffffffffffffffffffffffffffffffffff
      and
  // end of CompilerUtils::convertType()
  // ExpressionCompiler::visit(_memberAccess=msg.tokenid)
        /* "./examples/HelloWorld.solpp":174:185  msg.tokenid */
      tokenid
  // CompilerUtils::convertType(): tokenId -> tokenId
        /* "./examples/HelloWorld.solpp":160:198  addr.transfer(msg.tokenid ,msg.amount) */
      0xffffffffffffffffffff
      and
  // end of CompilerUtils::convertType()
  // ExpressionCompiler::visit(_memberAccess=msg.amount)
        /* "./examples/HelloWorld.solpp":187:197  msg.amount */
      callvalue
  // CompilerUtils::convertType(): uint256 -> uint256
  // end of CompilerUtils::convertType()
  // ExpressionCompiler::appendExternalFunctionCall(_(),
  //       args: [
  //             ]
  // )
  // evaluate arguments
  // copy function identifier to memory.
  // CompilerUtils::fetchFreeMemoryPointer()
        /* "./examples/HelloWorld.solpp":160:198  addr.transfer(msg.tokenid ,msg.amount) */
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
  // move arguments to memory
  // CompilerUtils::encodeToMemory()  stack[<v1> <v2> ... <vn> <mem>]
  //     givenTypes: [
  //             ]
  // the start of input
  // CompilerUtils::fetchFreeMemoryPointer()
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
  // stack: [input_start] top
      dup1
  // stack: [input_start, input_start] top
      dup3
  // stack: [input_start, input_start, input_end] top
      sub
  // stack: [input_start, input_size] top
      swap1
  // stack: [input_size, input_start] top
  // value to send
      dup4
  // token id
      dup6
  // contract address
      dup8
      call
  // pop stack slots 4
  // CompilerUtils::popStackSlots(4)
      pop
      pop
      pop
      pop
  // end of CompilerUtils::popStackSlots()
  // CompilerUtils::popStackSlots(0)
  // end of CompilerUtils::popStackSlots()
  // ExpressionCompiler::appendVariable(address payable addr, addr)
        /* "./examples/HelloWorld.solpp":222:226  addr */
      dup1
  // CompilerUtils::convertType(): address payable -> address payable
        /* "./examples/HelloWorld.solpp":213:239  transfer(addr, msg.amount) */
      0xffffffffffffffffffffffffffffffffffffffffff
      and
  // end of CompilerUtils::convertType()
      0xaa65281f5df4b4bd3c71f2ba25905b907205fce0809a816ef8e04b4d496a85bb
  // ExpressionCompiler::visit(_memberAccess=msg.amount)
        /* "./examples/HelloWorld.solpp":228:238  msg.amount */
      callvalue
  // CompilerUtils::fetchFreeMemoryPointer()
        /* "./examples/HelloWorld.solpp":213:239  transfer(addr, msg.amount) */
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
  // CompilerUtils::encodeToMemory()  stack[<v1> <v2> ... <vn> <mem>]
  //     givenTypes: [
  //             uint256
  //             ]
  // CompilerUtils::abiEncodeV2()  stack[<$value0> <$value1> ... <$value(n-1)> <$headStart>] top
  // CompilerContext::callYulFunction(name=abi_encode_tuple_t_uint256__to_t_uint256__fromStack_reversed, _inArgs=2, _outArgs=1)
      tag_5
  // CompilerUtils::moveIntoStack(2, 1)
  // CompilerUtils::rotateStackUp(3)
      swap2
      swap1
  // end of CompilerUtils::rotateStackUp()
      tag_6
      jump      // in
    tag_5:  // return of Yul function abi_encode_tuple_t_uint256__to_t_uint256__fromStack_reversed
  // CompilerUtils::fetchFreeMemoryPointer()
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
      dup1
      swap2
      sub
      swap1
      log2
  // CompilerUtils::popStackSlots(0)
  // end of CompilerUtils::popStackSlots()
  // start processing return data
        /* "./examples/HelloWorld.solpp":109:247  onMessage SayHello(address addr) payable {... */
    tag_3:  // return tag of SayHello(address)
  // CompilerUtils::popStackSlots(0)
  // end of CompilerUtils::popStackSlots()
  // finish processing return data
  // end of ContractCompiler::appendModifierOrFunctionCode()
  // remove variables: 1 parameters and 0 return parameters
  //  current stackLayout [0 -1 ]
      pop
      jump      // out
    tag_1:  // function selector
  // jump to fallback or ether receiver if the data is too short to contain a function selector
      jumpi(tag_7, lt(calldatasize, 0x04))
  // retrieve the function signature hash from the calldata
  // CompilerUtils::loadFromMemory(offset=0, type=uint32, fromCalldata=1, padToWordBoundaries=0)
      0x00
  // CompilerUtils::loadFromMemoryHelper()
      calldataload
  // CompilerUtils::rightShiftNumberOnStack(bits=224)
      0xe0
      shr
  // end of CompilerUtils::rightShiftNumberOnStack()
  // ContractCompiler::appendInternalSelector()
      dup1
      0x91a6cb4b
      eq
      tag_8
      jumpi
      jump(tag_7)
  // end of ContractCompiler::appendInternalSelector()
    tag_7:  // notFoundOrReceiveEther
      revert(0x00, 0x00)
    tag_8:  // calldata unpacker of function (address payable) payable external
  // return value packer of function (address payable) payable external
      tag_9
      0x04
      dup1
      calldatasize
      sub
  // CompilerUtils::abiDecodeV2() stack[<source_offset> <length>] top
      dup2
      add
      swap1
  // CompilerUtils::abiDecodeV2() stack[<end> <start>] top
  // CompilerContext::callYulFunction(name=abi_decode_tuple_t_address_payable, _inArgs=2, _outArgs=1)
      tag_10
  // CompilerUtils::moveIntoStack(2, 1)
  // CompilerUtils::rotateStackUp(3)
      swap2
      swap1
  // end of CompilerUtils::rotateStackUp()
      tag_11
      jump      // in
    tag_10:  // return of Yul function abi_decode_tuple_t_address_payable
      tag_2
      jump      // in
    tag_9:  // return value packer of function (address payable) payable external
  // ContractCompiler::appendReturnValuePacker()
  // check calldata length, if callback_id is not included, jump to the end
      jumpi(tag_12, gt(0x28, calldatasize))
      0x24
  // CompilerUtils::loadFromMemoryHelper()
      calldataload
  // CompilerUtils::rightShiftNumberOnStack(bits=224)
      0xe0
      shr
  // end of CompilerUtils::rightShiftNumberOnStack()
      dup1
      iszero
      tag_12
      jumpi
  // copy callback identifier to memory
  // CompilerUtils::fetchFreeMemoryPointer()
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
      swap1
  // CompilerUtils::storeInMemoryDynamic(type=uint32, _padToWordBoundaries=0, _cleanup=1)
  // CompilerUtils::prepareMemoryStore(type=uint32, ...)
  // CompilerUtils::convertType(): uint32 -> uint32
      0xffffffff
      and
  // end of CompilerUtils::convertType()
  // CompilerUtils::leftShiftNumberOnStack(bits=224)
      0xe0
      shl
  // end of CompilerUtils::leftShiftNumberOnStack()
  // end of CompilerUtils::prepareMemoryStore()
      dup2
      mstore
  // bytes of type uint32: 4
      0x04
      add
  // end of CompilerUtils::storeInMemoryDynamic()
  // move arguments to memory
  // CompilerUtils::encodeToMemory()  stack[<v1> <v2> ... <vn> <mem>]
  //     givenTypes: [
  //             ]
  // stack: [mem_end] top
      dup1
      0x28
      dup1
      calldatasize
      sub
  // stack: [input_end, input_end, context_data_offset, context_size] top
      dup1
  // CompilerUtils::moveIntoStack(3, 1)
  // CompilerUtils::rotateStackUp(4)
      swap3
      swap2
      swap1
  // end of CompilerUtils::rotateStackUp()
      swap2
      calldatacopy
      add
  // stack: [input_end_new] top
  // CompilerUtils::fetchFreeMemoryPointer()
      mload(0x40)
  // end of CompilerUtils::fetchFreeMemoryPointer()
      dup1
      swap2
      sub
      swap1
  // stack: [input_size, input_start] top
  // no value to send (0 VITE)
      0x00
      0x2445f6e5cde8c2c70e44
  // stack: [input_size, input_start, amount, token] top
      caller
  // stack: [input_size, input_start, amount, token, callback_address] top
      call
    tag_12:  // no sending callback
      stop
  // end of ContractCompiler::appendReturnValuePacker()
  // CompilerContext::appendYulUtilityFunctions()
      jump(tag_13)
    tag_14:
      0x00
      dup2
      calldataload
      swap1
      pop
      tag_16
      dup2
      tag_17
      jump      // in
    tag_16:
    tag_15:
      swap3
      swap2
      pop
      pop
      jump      // out
    tag_11:
      0x00
      0x20
      dup3
      dup5
      sub
      slt
      iszero
      tag_19
      jumpi
      0x00
      0x00
      revert
    tag_19:
      0x00
      tag_20
      dup5
      dup3
      dup6
      add
      tag_14
      jump      // in
    tag_20:
      swap2
      pop
      pop
    tag_18:
      swap3
      swap2
      pop
      pop
      jump      // out
    tag_21:
      tag_23
      dup2
      tag_24
      jump      // in
    tag_23:
      dup3
      mstore
    tag_22:
      pop
      pop
      jump      // out
    tag_6:
      0x00
      0x20
      dup3
      add
      swap1
      pop
      tag_26
      0x00
      dup4
      add
      dup5
      tag_21
      jump      // in
    tag_26:
    tag_25:
      swap3
      swap2
      pop
      pop
      jump      // out
    tag_27:
      0x00
      tag_29
      dup3
      tag_30
      jump      // in
    tag_29:
      swap1
      pop
    tag_28:
      swap2
      swap1
      pop
      jump      // out
    tag_30:
      0x00
      0xffffffffffffffffffffffffffffffffffffffffff
      dup3
      and
      swap1
      pop
    tag_31:
      swap2
      swap1
      pop
      jump      // out
    tag_24:
      0x00
      dup2
      swap1
      pop
    tag_32:
      swap2
      swap1
      pop
      jump      // out
    tag_17:
      tag_34
      dup2
      tag_27
      jump      // in
    tag_34:
      dup2
      eq
      iszero
      iszero
      tag_35
      jumpi
      0x00
      0x00
      revert
    tag_35:
    tag_33:
      pop
      jump      // out
    tag_13:

    auxdata: 0xa165627a7a7230582000000000000000000000000000000000000000000000000000000000000000000029
}

=======
Offchain assembly:
=======
  // ContractCompiler::initializeContext()
    /* "./examples/HelloWorld.solpp":26:249  contract HelloWorld {... */
  0x80
  // CompilerUtils::storeFreeMemoryPointer()
  0x40
  mstore
  // end of CompilerUtils::storeFreeMemoryPointer()
  // ContractCompiler::registerStateVariables()
  // end of ContractCompiler::registerStateVariables()
  // jump to fallback or ether receiver if the data is too short to contain a function selector
  jumpi(tag_2, lt(calldatasize, 0x04))
tag_2:  // notFoundOrReceiveEther
  revert(0x00, 0x00)

Binary:
60806040523480156100115760006000fd5b50610017565b610217806100266000396000f3fe6080604052610094565b8074ffffffffffffffffffffffffffffffffffffffffff164669ffffffffffffffffffff163460405160405180820390838587f1505050508074ffffffffffffffffffffffffffffffffffffffffff167faa65281f5df4b4bd3c71f2ba25905b907205fce0809a816ef8e04b4d496a85bb346040516100889190610173565b60405180910390a25b50565b600436106100b25760003560e01c806391a6cb4b146100b8576100b2565b60006000fd5b6100d260048036038101906100cd9190610138565b610009565b3660281161011c5760243560e01c801561011c576040519063ffffffff1660e01b815260040180602880360380929190913701604051809103906000692445f6e5cde8c2c70e4433f15b006101ea565b600081359050610131816101cf565b5b92915050565b60006020828403121561014b5760006000fd5b600061015984828501610122565b9150505b92915050565b61016c816101c4565b82525b5050565b60006020820190506101886000830184610163565b5b92915050565b600061019a826101a2565b90505b919050565b600074ffffffffffffffffffffffffffffffffffffffffff821690505b919050565b60008190505b919050565b6101d88161018f565b811415156101e65760006000fd5b5b50565bfea165627a7a7230582000000000000000000000000000000000000000000000000000000000000000000029
OffChain Binary:
608060405260043610600c575b60006000fd
Contract JSON ABI
[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address payable","name":"addr","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","type":"event"},{"executionBehavior":"async","inputs":[{"internalType":"address payable","name":"addr","type":"address"}],"name":"SayHello","outputs":[],"stateMutability":"payable","type":"function"}]`
console.log(linesParser(example.split(os.EOL)))
// Get Funds from users
// withdraw funs
// set a minimum funding value

// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.8;
// Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

// Error
error FundMe__NotOwner();

// Interfaces, Libraries, contracts

/** @title A contract for crowd funding
 *  @author YiChu
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our libraru
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // state varibles
    uint256 public constant minimumUsd = 5000000000000000;
    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;
    address public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "You are not the owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // want to be able to set a minimum fund amount in USD
        // 1. how do we send eth to this contract
        require(
            msg.value.getConversionRate(priceFeed) >= minimumUsd,
            "Didnt send enough ether"
        ); // 1e18 = 1* 10 **18
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function getFunders() public view returns (address[] memory) {
        return funders;
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            addressToAmountFunded[funder] = 0;
        }
        // reset the array
        funders = new address[](0);
        // withdraw the funds
        // transferhello
        // payable(msg.sender).transfer(address(this).balance);
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Transact Fail");
    }
}

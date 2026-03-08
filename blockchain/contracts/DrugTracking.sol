
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DrugSupplyChain {

    address public admin;

    enum Role { None, Manufacturer, Distributor, Pharmacy }
    enum Status { Created, Shipped, Received, Sold }

    struct Drug {
        string name;
        string batchId;
        uint256 expiryDate;
        address manufacturer;
        address currentOwner;
        Status status;
        bool exists;
    }

    mapping(address => Role) public roles;
    mapping(string => Drug) private drugs;

    // ================= EVENTS =================

    event RoleAssigned(address indexed user, Role role);
    event DrugCreated(string indexed batchId, address indexed manufacturer);
    event DrugTransferred(string indexed batchId, address indexed from, address indexed to);
    event DrugReceived(string indexed batchId, address indexed receiver);
    event DrugSold(string indexed batchId, address indexed pharmacy);

    // ================= MODIFIERS =================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Unauthorized role");
        _;
    }

    modifier drugExists(string memory _batchId) {
        require(drugs[_batchId].exists, "Drug not found");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Manufacturer;
    }

    // ================= ROLE MANAGEMENT =================

    function assignRole(address user, Role role) external onlyAdmin {
        require(user != address(0), "Invalid address");
        roles[user] = role;
        emit RoleAssigned(user, role);
    }

    // ================= DRUG CREATION =================

    function createDrug(
        string memory _name,
        string memory _batchId,
        uint256 _expiryDate
    ) external onlyRole(Role.Manufacturer) {

        require(!drugs[_batchId].exists, "Batch already exists");
        require(_expiryDate > block.timestamp, "Invalid expiry");

        drugs[_batchId] = Drug({
            name: _name,
            batchId: _batchId,
            expiryDate: _expiryDate,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            status: Status.Created,
            exists: true
        });

        emit DrugCreated(_batchId, msg.sender);
    }

    // ================= TRANSFER =================

    function transferDrug(string memory _batchId, address _to)
        external
        drugExists(_batchId)
    {
        Drug storage drug = drugs[_batchId];

        require(drug.currentOwner == msg.sender, "Not current owner");
        require(_to != address(0), "Invalid receiver");
        require(drug.status != Status.Sold, "Already sold");

        // Enforce proper supply chain flow
        if (roles[msg.sender] == Role.Manufacturer) {
            require(roles[_to] == Role.Distributor, "Must transfer to Distributor");
        } else if (roles[msg.sender] == Role.Distributor) {
            require(roles[_to] == Role.Pharmacy, "Must transfer to Pharmacy");
        } else {
            revert("Transfer not allowed");
        }

        require(block.timestamp < drug.expiryDate, "Drug expired");

        drug.currentOwner = _to;
        drug.status = Status.Shipped;

        emit DrugTransferred(_batchId, msg.sender, _to);
    }

    // ================= RECEIVE =================

    function receiveDrug(string memory _batchId)
        external
        drugExists(_batchId)
    {
        Drug storage drug = drugs[_batchId];

        require(drug.currentOwner == msg.sender, "Not receiver");
        require(drug.status == Status.Shipped, "Not shipped");

        drug.status = Status.Received;

        emit DrugReceived(_batchId, msg.sender);
    }

    // ================= SELL =================

    function sellDrug(string memory _batchId)
        external
        onlyRole(Role.Pharmacy)
        drugExists(_batchId)
    {
        Drug storage drug = drugs[_batchId];

        require(drug.currentOwner == msg.sender, "Not owner");
        require(drug.status == Status.Received, "Not ready to sell");
        require(block.timestamp < drug.expiryDate, "Drug expired");

        drug.status = Status.Sold;

        emit DrugSold(_batchId, msg.sender);
    }

    // ================= VIEW FUNCTION =================

    function getDrug(string memory _batchId)
        external
        view
        drugExists(_batchId)
        returns (Drug memory)
    {
        return drugs[_batchId];
    }
}
const hre = require("hardhat");


const createEvent = async (rsvpContract, deposit) => {
  let maxCapacity = 3;
  let timestamp = 1718926200;
  let eventDataCID =
    "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

  let txn = await rsvpContract.createNewEvent(
    timestamp,
    deposit,
    maxCapacity,
    eventDataCID
  );
  let wait = await txn.wait();
  console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);

  let eventID = wait.events[0].args.eventID;
  console.log("EVENT ID:", eventID);
  return eventID
}

const createRsvp = async (rsvpContract, eventID, deposit, address) => {
  txn = await rsvpContract
    .connect(address)
    .createNewRSVP(eventID, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);
}

const confirmAttendees = async (rsvpContract, eventID) => {
  txn = await rsvpContract.confirmAllAttendees(eventID);
  wait = await txn.wait();
  wait.events.forEach((event) =>
    console.log("CONFIRMED:", event.args.attendeeAddress)
  );
}

const withdrawDeposits = async (rsvpContract, eventID) => {
  txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
  wait = await txn.wait();
  console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);
}

const scenario1 = async (rsvpContract) => {
  const [deployer, address1, address2, address3] = await hre.ethers.getSigners();
  // Event info needed for the customer
  let deposit = hre.ethers.utils.parseEther("1");

  let eventID = await createEvent(rsvpContract, deposit);
  await createRsvp(rsvpContract, eventID, deposit, address1);
  await createRsvp(rsvpContract, eventID, deposit, address2);

  try {
    // Should fail cause address already registered
    await createRsvp(rsvpContract, eventID, deposit, address1);
  } catch (error) {
    console.log(error);
  }
  await createRsvp(rsvpContract, eventID, deposit, deployer);
  try {
    // Should fail cause event full
    await createRsvp(rsvpContract, eventID, deposit, address3);
  } catch (error) {
    console.log(error);
  }

  await confirmAttendees(rsvpContract, eventID);
  // wait 10 years
  await hre.network.provider.send("evm_increaseTime", [15778800000000]);
  await withdrawDeposits(rsvpContract, eventID);
}

const main = async () => {
  // Deploy contract
  const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
  const rsvpContract = await rsvpContractFactory.deploy();
  await rsvpContract.deployed();
  console.log("Contract deployed to:", rsvpContract.address);
  // Test logic
  await scenario1(rsvpContract);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
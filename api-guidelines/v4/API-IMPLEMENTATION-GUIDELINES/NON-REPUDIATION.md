# Handling Non-Repudiation

Where data security is important, an action performed by a user must have an
authentication that can be assured to be genuine with a high degree of
confidence. This is known as non-repudiation.[\[13\]](#f13) Once a security
environment has been established, operational logs consisting of (minimally) the
user, application, resource, operation, and date/time information should be
maintained to establish a basis for non-repudiation[\[14\]](#f14) within an
Ed-Fi REST API implementation. These logs should be audited on a regular basis.

-----

<a name="f13"></a>13. Non-repudiation is discussed in detail here.

<a name="f14"></a>14. When all REST API actions are secure and logged, the user
purported to have performed an action must actually have done it. Without
appropriate security or logging, it cannot be guaranteed that a specific user
actually performed an action on the system.

## Ed-Fi API Design and Implementation Guidelines

* [Scope](../SCOPE.md)
* [Key Characteristics](../KEY-CHARACTERISTICS.md)
* [Requirement Levels](../REQUIREMENT-LEVELS.md)
* [API Design Guidelines](../API-DESIGN-GUIDELINES/README.md)
* [API Implementation Guidelines](../API-IMPLEMENTATION-GUIDELINES/README.md)
  * [Handling Authentication and Authorization](AUTH.md)
  * [Handling Non-Repudiation](NON-REPUDIATION.md)
  * [Handling Optimistic Concurrency with ETags](OPTIMISTIC-CONCURRENCY.md)
  * [Handling Web Cache Validation with ETags](CACHE-VALIDATION.md)
